import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import {notifyUserForNearbyReviewedPlaces} from '../GlobalFunctions/main';
import {store} from '../redux/Store';
import {Platform} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {GetReviews} from '../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../ApiCalls/Main/WishList_API/WishListAPI';
import {isWithinRadius} from '../utils/LocationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppColors from '../utils/AppColors';
import axios from 'axios';
import {Google_API_KEY, Google_Base_Url} from '../utils/api_content';
import {triggerRateNotification} from '../utils/Notifications';

// Sleep helper
const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

// Task Options for the Background Service
const options = {
  taskName: 'LocationTracking',
  taskTitle: 'Location Tracking Active',
  taskDesc: 'Updating location in background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: AppColors.BTNCOLOURS,
  linkingURI: 'wigout://chat/jane', // Optional: Deep link
  parameters: {
    delay: 300000, // 5 minutes in milliseconds
  },
};

const veryIntensiveTask = async taskDataArguments => {
  const {delay} = taskDataArguments;

  while (BackgroundService.isRunning()) {
    const state = store.getState();
    const settings = state?.user?.notificationSettings;

    if (!settings?.backgroundLocation) {
      console.log('Background Location disabled in settings, stopping task.');
      await BackgroundService.stop();
      break;
    }

    console.log('Background Service pulse...');

    try {
      const state = store.getState();
      const token = state?.user?.token;

      if (token) {
        await checkProximityAndNotify(token);
      } else {
        console.log('No token found in Redux store, skipping pulse.');
      }
    } catch (error) {
      console.error('Background Service Error:', error);
    }

    await sleep(delay);
  }
};

const checkProximityAndNotify = async token => {
  Geolocation.getCurrentPosition(
    async position => {
      const {latitude, longitude} = position.coords;
      // console.log('Current Background Location:', latitude, longitude);
      // let latitude = 37.455756; // AVOID
      // let longitude = -122.227941; // AVOID
      // let latitude = 37.782386; // GO AGAIN
      // let longitude = -122.402097; // GO AGAIN
      // let latitude = 37.3225578; // NEW
      // let longitude = -122.0346885; // NEW

      // 1. Send to Backend (existing logic)
      notifyUserForNearbyReviewedPlaces(token, latitude, longitude);

      // 2. Local Geofencing Logic
      try {
        const [revRes, wishRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);

        const reviews = revRes?.reviews || [];
        const wishlist = wishRes?.wishLists || wishRes?.data || wishRes || [];

        const allPlaces = [
          ...reviews.map(r => ({
            ...r,
            id: r.placeId, // USE placeId for geofencing and details
            name: r.restaurantName,
            lat: r.latitude,
            lng: r.longitude,
            type: r.actionType, // 'Go Again' or 'Avoid'
          })),
          ...(Array.isArray(wishlist) ? wishlist : []).map(w => ({
            ...w,
            id: w.placeId,
            name: w.name,
            lat: w.latitude,
            lng: w.longitude,
            type: 'WishList',
          })),
        ];

        // Filter out places without coordinates
        const trackablePlaces = allPlaces.filter(p => p.lat && p.lng);

        const state = store.getState();
        const settings = state?.user?.notificationSettings;
        if (settings?.recommendations) {
          const notifiedRaw = await AsyncStorage.getItem('notified_places');
          const notifiedHistory = notifiedRaw ? JSON.parse(notifiedRaw) : {};
          const now = Date.now();

          for (const place of trackablePlaces) {
            if (
              isWithinRadius(latitude, longitude, place.lat, place.lng, 200)
            ) {
              // Check if notified in last 24 hours
              const lastNotified = notifiedHistory[place.id] || 0;
              if (now - lastNotified > 24 * 60 * 60 * 1000) {
                await triggerLocalNotification(place);
                notifiedHistory[place.id] = now;
              }
            }
          }

          await AsyncStorage.setItem(
            'notified_places',
            JSON.stringify(notifiedHistory),
          );

          // 3. First-Time Visit Detection
          await checkFirstTimeVisit(
            latitude,
            longitude,
            reviews,
            wishlist,
            notifiedHistory,
          );
        } else {
          console.log(
            'Recommendations disabled in settings, skipping local notifications.',
          );
        }
      } catch (err) {
        console.error('Geofencing logic error:', err);
      }
    },
    error => {
      console.error('Background Location Error:', error.code, error.message);
    },
    {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
  );
};

const triggerLocalNotification = async place => {
  let title = 'Check this out!';
  let body = `You are near ${place.name}.`;

  if (place.type === 'Go Again') {
    title = 'Welcome back?';
    body = `You're near ${place.name}, one of your favorites!`;
  } else if (place.type === 'Avoid') {
    title = 'Heads up!';
    body = `You're near ${place.name}, which you've marked to avoid.`;
  } else if (place.type === 'WishList') {
    title = 'WishList spot nearby!';
    body = `${place.name} is on your wishlist. Why not stop by?`;
  }

  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: 'geofencing_notifications',
    name: 'Nearby Places Alerts',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
    data: {
      placeDetails: JSON.stringify({
        ...place,
        placeId: place.id,
        place_id: place.id, // Add both formats for compatibility
        name: place.name,
        latitude: place.lat,
        longitude: place.lng,
      }),
      isFromWelcomeBack: place.type === 'Go Again' ? 'true' : 'false',
      isFromAvoid: place.type === 'Avoid' ? 'true' : 'false',
    },
  });
};

const checkFirstTimeVisit = async (
  latitude,
  longitude,
  reviews,
  wishlist,
  notifiedHistory,
) => {
  try {
    const url = `${Google_Base_Url}place/nearbysearch/json?location=${latitude},${longitude}&radius=500&type=restaurant&key=${Google_API_KEY}`;
    const response = await axios.get(url);
    const nearby = response.data?.results || [];
    console.log('resp in checkFirstTimeVisit:-', response?.data?.results);
    // Filter out places already in lists
    const reviewedIds = new Set(reviews.map(r => r.placeId));
    const wishlistIds = new Set(wishlist.map(w => w.placeId));

    const newNearbyPlaces = nearby.filter(p => {
      const isNew =
        !reviewedIds.has(p.place_id) && !wishlistIds.has(p.place_id);
      if (!isNew)
        console.log(`Place "${p.name}" filtered out (already in lists)`);
      return isNew;
    });

    console.log('New Nearby Places count:', newNearbyPlaces.length);

    if (newNearbyPlaces.length > 0) {
      // Find the closest one
      const closest = newNearbyPlaces[0];

      const distance = isWithinRadius(
        latitude,
        longitude,
        closest.geometry.location.lat,
        closest.geometry.location.lng,
        1000, // Check distance within 1km for logging
      );

      console.log(`Closest Place: ${closest.name}`);

      // Check if within 200m "Visit" threshold (increased for debugging)
      if (
        isWithinRadius(
          latitude,
          longitude,
          closest.geometry.location.lat,
          closest.geometry.location.lng,
          200,
        )
      ) {
        console.log(`User IS within 200m of ${closest.name}`);
        const now = Date.now();
        const lastNotified = notifiedHistory[closest.place_id] || 0;

        console.log(
          `Last notified for ${closest.name}: ${new Date(
            lastNotified,
          ).toLocaleString()}`,
        );

        // Throttle reduced to 1 minute for testing
        if (now - lastNotified > 60 * 1000) {
          console.log(`Triggering rate prompt for ${closest.name}`);
          await triggerRateNotification({
            place_id: closest.place_id,
            name: closest.name,
            address: closest.vicinity,
            rating: closest.rating,
            user_ratings_total: closest.user_ratings_total,
            geometry: closest.geometry,
            photos: closest.photos,
          });

          notifiedHistory[closest.place_id] = now;
          await AsyncStorage.setItem(
            'notified_places',
            JSON.stringify(notifiedHistory),
          );
        } else {
          console.log(
            `Throttled: Skipping notification for ${closest.name} (notified < 1 min ago)`,
          );
        }
      } else {
        console.log(`User NOT within 200m of ${closest.name}`);
      }
    }
  } catch (err) {
    console.log('Error in checkFirstTimeVisit:', err);
  }
};

export const startBackgroundService = async () => {
  try {
    if (!BackgroundService.isRunning()) {
      await BackgroundService.start(veryIntensiveTask, options);
      console.log('Background Service Started');
    }
  } catch (e) {
    console.error('Error starting background service:', e);
  }
};

export const stopBackgroundService = async () => {
  try {
    await BackgroundService.stop();
    console.log('Background Service Stopped');
  } catch (e) {
    console.error('Error stopping background service:', e);
  }
};
