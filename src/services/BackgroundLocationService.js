import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import {
  notifyForNewPlace,
  notifyUserForNearbyReviewedPlaces,
} from '../GlobalFunctions/main';
import {store} from '../redux/Store';
import AppColors from '../utils/AppColors';
import axios from 'axios';
import {Google_API_KEY, Google_Base_Url} from '../utils/api_content';
import {getDistance, isWithinRadius} from '../utils/LocationUtils';
import {Platform} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {GetReviews} from '../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../ApiCalls/Main/WishList_API/WishListAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Check and notify for new place if user matches any nearby place from search
const checkAndNotifyForNewPlace = async (token, latitude, longitude) => {
  try {
    const url = `${Google_Base_Url}place/nearbysearch/json?location=${latitude},${longitude}&radius=100&type=restaurant&key=${Google_API_KEY}`;
    console.log('Hitting nearbysearch for new place checks:', url);
    const response = await axios.get(url);
    const results = response.data?.results || [];
    console.log(`Found ${results.length} nearby places within 100m.`);

    if (results.length > 0) {
      // Find the closest place
      const sortedResults = results
        .map(place => {
          const placeLat = place.geometry?.location?.lat;
          const placeLng = place.geometry?.location?.lng;
          const dist = getDistance(latitude, longitude, placeLat, placeLng);
          return {...place, distance: dist};
        })
        .sort((a, b) => a.distance - b.distance);

      const closest = sortedResults[0];
      console.log(
        `Closest place is ${
          closest.name
        } at a distance of ${closest.distance.toFixed(1)} meters.`,
      );

      // If closest is within 100 meters (which is our search radius)
      if (closest.distance <= 100) {
        const placeId = closest.place_id;
        const placeName = closest.name;

        console.log(`Calling notifyForNewPlace for: ${placeName} (${placeId})`);
        await notifyForNewPlace(token, placeId, placeName);

        return {
          placeName,
          placeId,
        };
      }
    }
  } catch (error) {
    console.error('Error in checkAndNotifyForNewPlace:', error);
  }
  return null;
};

const checkProximityAndNotify = async token => {
  Geolocation.getCurrentPosition(
    async position => {
      // const {latitude, longitude} = position.coords;
      // console.log('Current Background Location:', latitude, longitude);
      // let latitude = 37.425433; // AVOID
      // let longitude = -122.1452; // AVOID
      // let latitude = 37.763028; // GO AGAIN
      // let longitude = -122.424111; // GO AGAIN
      let latitude = 37.3225578; // NEW
      let longitude = -122.0346885; // NEW
      // let latitude = 37.8063737; // WishList
      // let longitude = -122.2706835; // WishList

      // 1. Send to Backend (existing logic)
      notifyUserForNearbyReviewedPlaces(token, latitude, longitude);

      // Check and notify backend for new place if user matches any restaurant
      try {
        const matched = await checkAndNotifyForNewPlace(
          token,
          latitude,
          longitude,
        );
        if (matched) {
          console.log('Matched and notified for new place:', matched);
        }
      } catch (err) {
        console.error('Error in notifyForNewPlace flow:', err);
      }
    },
    error => {
      console.error('Background Location Error:', error.code, error.message);
    },
    {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
  );
};

// const triggerLocalNotification = async place => {
//   // let title = 'Check this out!';
//   // let body = `You are near ${place.name}.`;
//   // if (place.type === 'WishList') {
//   //   title = 'WishList spot nearby!';
//   //   body = `${place.name} is on your wishlist. Why not stop by?`;
//   // }
//   // if (place.type === 'Go Again') {
//   //   title = 'Welcome back?';
//   //   body = `You're near ${place.name}, one of your favorites!`;
//   // } else if (place.type === 'Avoid') {
//   //   title = 'Heads up!';
//   //   body = `You're near ${place.name}, which you've marked to avoid.`;
//   // } else if (place.type === 'WishList') {
//   //   title = 'WishList spot nearby!';
//   //   body = `${place.name} is on your wishlist. Why not stop by?`;
//   // }
//   // await notifee.requestPermission();
//   // const channelId = await notifee.createChannel({
//   //   id: 'geofencing_notifications',
//   //   name: 'Nearby Places Alerts',
//   //   importance: AndroidImportance.HIGH,
//   // });
//   // await notifee.displayNotification({
//   //   id: place.id || place.place_id || undefined,
//   //   title,
//   //   body,
//   //   android: {
//   //     channelId,
//   //     smallIcon: 'ic_launcher',
//   //     importance: AndroidImportance.HIGH,
//   //     pressAction: {
//   //       id: 'default',
//   //       launchActivity: 'default',
//   //     },
//   //   },
//   //   data: {
//   //     placeDetails: JSON.stringify({
//   //       ...place,
//   //       placeId: place.id,
//   //       place_id: place.id, // Add both formats for compatibility
//   //       name: place.name,
//   //       latitude: place.lat,
//   //       longitude: place.lng,
//   //     }),
//   //     isFromWelcomeBack: place.type === 'Go Again' ? 'true' : 'false',
//   //     isFromAvoid: place.type === 'Avoid' ? 'true' : 'false',
//   //   },
//   // });
// };

// const checkFirstTimeVisit = async (
//   latitude,
//   longitude,
//   reviews,
//   wishlist,
//   notifiedHistory,
// ) => {
//   try {
//     const url = `${Google_Base_Url}place/nearbysearch/json?location=${latitude},${longitude}&radius=100&type=restaurant&key=${Google_API_KEY}`;
//     const response = await axios.get(url);
//     const nearby = response.data?.results || [];
//     console.log('resp in checkFirstTimeVisit:-', response?.data?.results);
//     // Filter out places already in lists
//     const reviewedIds = new Set(reviews.map(r => r.placeId));
//     const wishlistIds = new Set(wishlist.map(w => w.placeId));

//     const newNearbyPlaces = nearby.filter(p => {
//       const isNew =
//         !reviewedIds.has(p.place_id) && !wishlistIds.has(p.place_id);
//       if (!isNew)
//         console.log(`Place "${p.name}" filtered out (already in lists)`);
//       return isNew;
//     });

//     console.log('New Nearby Places count:', newNearbyPlaces.length);

//     if (newNearbyPlaces.length > 0) {
//       // Find the closest one
//       const closest = newNearbyPlaces[0];

//       console.log(`Closest Place: ${closest.name}`);

//       // Check if within 200m "Visit" threshold (increased for debugging)
//       if (
//         isWithinRadius(
//           latitude,
//           longitude,
//           closest.geometry.location.lat,
//           closest.geometry.location.lng,
//           200,
//         )
//       ) {
//         console.log(`User IS within 200m of ${closest.name}`);
//         const now = Date.now();
//         const lastNotified = notifiedHistory[closest.place_id] || 0;

//         console.log(
//           `Last notified for ${closest.name}: ${new Date(
//             lastNotified,
//           ).toLocaleString()}`,
//         );

//         // Throttle set to 24 hours
//         if (now - lastNotified > 24 * 60 * 60 * 1000) {
//           console.log(`Triggering rate prompt for ${closest.name}`);
//           await triggerRateNotification({
//             place_id: closest.place_id,
//             name: closest.name,
//             address: closest.vicinity,
//             rating: closest.rating,
//             user_ratings_total: closest.user_ratings_total,
//             geometry: closest.geometry,
//             photos: closest.photos,
//           });

//           notifiedHistory[closest.place_id] = now;
//           await AsyncStorage.setItem(
//             'notified_places',
//             JSON.stringify(notifiedHistory),
//           );
//         } else {
//           console.log(
//             `Throttled: Skipping notification for ${closest.name} (notified < 24 hours ago)`,
//           );
//         }
//       } else {
//         console.log(`User NOT within 200m of ${closest.name}`);
//       }
//     }
//   } catch (err) {
//     console.log('Error in checkFirstTimeVisit:', err);
//   }
// };

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
