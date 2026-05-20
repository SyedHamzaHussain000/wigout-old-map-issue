import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Routes from './src/routes/Routes';
import {persistor, store} from './src/redux/Store';
import {Provider, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {webClientId} from './src/utils/api_content';
import {
  listenForForegroundMessages,
  registerNotifeeForegroundHandler,
  requestUserPermission,
  displayNotification, // ✅ Added proper import
} from './src/utils/Notifications';
import {
  startBackgroundService,
  stopBackgroundService,
} from './src/services/BackgroundLocationService';
import {requestLocationPermission} from './src/utils/Permissions';
import {navigationRef, navigate} from './src/utils/NavigationService';
import {EventType} from '@notifee/react-native';
import {notifyUserForNearbyReviewedPlaces} from './src/GlobalFunctions/main';
import notifee from '@notifee/react-native';
import {StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const latitude = '37.4191213';
const longitude = '-122.0932968';

const BackgroundManager = () => {
  const token = useSelector((state: any) => state?.user?.token);
  const location = useSelector((state: any) => state?.user?.current_location);

  useEffect(() => {
    const startService = async () => {
      if (token) {
        // ✅ Immediate hit when active/on login
        // if (location?.latitude) {
        //   notifyUserForNearbyReviewedPlaces(
        //     token,
        //     location?.latitude,
        //     location?.longitude,
        //   );
        // }

        const permissionGranted = await requestLocationPermission();
        if (permissionGranted) {
          startBackgroundService();
        } else {
          console.log('Location permission not granted, service not started.');
        }
      } else {
        stopBackgroundService();
      }
    };

    startService();
  }, [token]);

  return null;
};

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    });

    // Initialize Notifications
    const initNotifications = async () => {
      const unsubscribeMessaging = listenForForegroundMessages();
      const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
        async ({type, detail}) => {
          if (type === EventType.PRESS) {
            console.log(
              'Notification pressed in Foreground!',
              detail.notification,
            );
            let placeDetails = detail.notification?.data?.placeDetails;
            const placeId =
              detail.notification?.data?.placeId ||
              detail.notification?.data?.place_id;
            const isFromWelcomeBack =
              detail.notification?.data?.actionType === 'Go Again';
            const isFromAvoid =
              detail.notification?.data?.actionType === 'Avoid';
            const actionType = detail.notification?.data?.actionType;
            console.log('Action type from notification:', actionType);
            console.log('Place Details from notification:', placeDetails);
            console.log('Place ID from notification:', placeId);

            if (!placeDetails && placeId) {
              placeDetails = {placeId};
            }

            if (placeDetails) {
              const parsedDetails =
                typeof placeDetails === 'string'
                  ? JSON.parse(placeDetails)
                  : placeDetails;
              console.log(
                'Navigating to HomeDetails with:',
                parsedDetails.name || parsedDetails.placeId,
              );
              navigate('HomeDetails', {
                placeDetails: parsedDetails,
                isFromWelcomeBack,
                isFromAvoid,
              });
            }
          }
        },
      );

      return () => {
        unsubscribeMessaging();
        unsubscribeNotifeeForeground();
      };
    };

    // Handle App launch from notification
    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log(
          'App launched from notification:',
          initialNotification.notification,
        );
        let placeDetails = initialNotification.notification?.data?.placeDetails;
        const placeId =
          initialNotification.notification?.data?.placeId ||
          initialNotification.notification?.data?.place_id;
        const isFromWelcomeBack =
          initialNotification.notification?.data?.actionType === 'Go Again';
        const isFromAvoid =
          initialNotification.notification?.data?.actionType === 'Avoid';
        const actionType = initialNotification.notification?.data?.actionType;
        console.log('Action type from initial notification:', actionType);
        console.log('Initial Notification Place Details:', placeDetails);
        console.log('Initial Notification Place ID:', placeId);

        if (!placeDetails && placeId) {
          placeDetails = {placeId};
        }

        if (placeDetails) {
          const parsedDetails =
            typeof placeDetails === 'string'
              ? JSON.parse(placeDetails)
              : placeDetails;
          console.log(
            'Navigating (Initial) to HomeDetails with:',
            parsedDetails.name || parsedDetails.placeId,
          );
          navigate('HomeDetails', {
            placeDetails: parsedDetails,
            isFromWelcomeBack,
            isFromAvoid,
          });
        }
      }
    };

    // Check for notification clicks stored in background
    const checkAsyncStorageNotification = async () => {
      try {
        const lastNotificationStr = await AsyncStorage.getItem(
          'last_notification_press',
        );
        if (lastNotificationStr) {
          await AsyncStorage.removeItem('last_notification_press');
          const notification = JSON.parse(lastNotificationStr);
          console.log(
            'App resumed/opened from AsyncStorage background press:',
            notification,
          );
          let placeDetails = notification?.data?.placeDetails;
          const placeId =
            notification?.data?.placeId || notification?.data?.place_id;
          const isFromWelcomeBack =
            notification?.data?.isFromWelcomeBack === 'true';
          const isFromAvoid = notification?.data?.isFromAvoid === 'true';

          if (!placeDetails && placeId) {
            placeDetails = {placeId};
          }

          if (placeDetails) {
            const parsedDetails =
              typeof placeDetails === 'string'
                ? JSON.parse(placeDetails)
                : placeDetails;
            console.log(
              'Navigating (AsyncStorage) to HomeDetails with:',
              parsedDetails.name || parsedDetails.placeId,
            );
            navigate('HomeDetails', {
              placeDetails: parsedDetails,
              isFromWelcomeBack,
              isFromAvoid,
            });
          }
        }
      } catch (e) {
        console.error('Error checking AsyncStorage notification:', e);
      }
    };

    const cleanup = initNotifications();
    checkInitialNotification();
    checkAsyncStorageNotification();

    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer ref={navigationRef}>
          <BackgroundManager />
          {/* <StatusBar barStyle={'dark-content'} hidden /> */}
          <Routes />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default App;
