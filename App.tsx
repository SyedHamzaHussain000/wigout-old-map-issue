import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Routes from './src/routes/Routes';
import { persistor, store } from './src/redux/Store';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { webClientId } from './src/utils/api_content';
import { listenForForegroundMessages } from './src/utils/Notifications';
import {
  startBackgroundService,
  stopBackgroundService,
} from './src/services/BackgroundLocationService';
import { requestLocationPermission } from './src/utils/Permissions';
import { navigationRef, navigate } from './src/utils/NavigationService';
import { EventType } from '@notifee/react-native';
import notifee from '@notifee/react-native';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { connectSocket, disconnectSocket } from './src/utils/Socket';

import {
  withIAPContext,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  Purchase,
} from 'react-native-iap';
import { subscribeUser } from './src/GlobalFunctions/main';
import { UpdateProfile, updateNotificationSettings } from './src/redux/Slices';
import { ShowToast } from './src/utils/api_content';

const BackgroundManager = () => {
  const token = useSelector((state: any) => state?.user?.token);
  const userData = useSelector((state: any) => state?.user?.userData);
  const settings = useSelector((state: any) => state?.user?.notificationSettings);
  const dispatch = useDispatch();

  // ── Location service: start on login, stop on logout ────────────────────
  useEffect(() => {
    const startService = async () => {
      if (token) {
        if (settings?.backgroundLocation) {
          const permissionGranted = await requestLocationPermission();
          if (permissionGranted) {
            startBackgroundService();
          } else {
            console.log('Location permission not granted, service not started.');
            dispatch(updateNotificationSettings({ backgroundLocation: false }));
          }
        } else {
          stopBackgroundService();
        }
      } else {
        stopBackgroundService();
      }
    };
    startService();
  }, [token, settings?.backgroundLocation]);

  // ── Socket: all lifecycle in one place ───────────────────────────────────
  useEffect(() => {
    const manageSocket = () => {
      if (token) {
        connectSocket(token);
      } else {
        disconnectSocket();
        return;
      }

      const handleAppStateChange = (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          // console.log('[Socket] App active — reconnecting');
          connectSocket(token);
        } else {
          // console.log(`[Socket] App ${nextState} — disconnecting`);
          disconnectSocket();
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription.remove();
    };

    const cleanup = manageSocket();
    return () => cleanup?.();
  }, [token]);

  // ── Global IAP Observers Framework ───────────────────────────────────────
  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIAPListeners = () => {
      try {
        console.log('[Global IAP] Initializing listeners...');
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
          console.log('[Global IAP] ========= PURCHASE EVENT DETECTED =========');
          console.log('[Global IAP] Product ID:', purchase.productId);
          console.log('[Global IAP] Purchase Token (Google Play):', purchase.purchaseToken);
          console.log('[Global IAP] Transaction ID:', purchase.transactionId || purchase.id);
          console.log('[Global IAP] Full Purchase Object:', JSON.stringify(purchase, null, 2));
          console.log('[Global IAP] =============================================');
          const receipt = purchase.purchaseToken;
          if (receipt) {
            try {
              const planId = purchase.productId;

              // Backend verification dispatch call
              const res = await subscribeUser(
                token,
                planId,
                receipt,
                purchase.transactionId || purchase.id
              );

              if (res?.success) {
                ShowToast('success', 'Subscription processed successfully.');
                dispatch(UpdateProfile(res?.data));
              } else if (token) {
                // Local fallback validation rules
                const updatedUserData = {
                  ...userData,
                  subscription: {
                    plan: planId,
                    status: 'active',
                    transactionId: purchase.transactionId || purchase.id,
                  },
                };
                dispatch(UpdateProfile(updatedUserData));
              }

              // Acknowledge transaction lifecycle completion
              await finishTransaction({ purchase, isConsumable: false });
            } catch (err) {
              console.error('[Global IAP] Process transaction error:', err);
            }
          }
        });

        purchaseErrorSubscription = purchaseErrorListener((error) => {
          console.log('[Global IAP] ========= PURCHASE ERROR =========');
          console.log('[Global IAP] Error code:', error?.code);
          console.log('[Global IAP] Error message:', error?.message);
          console.log('[Global IAP] Error responseCode:', error?.responseCode);
          console.log('[Global IAP] Error debugMessage:', error?.debugMessage);
          console.log('[Global IAP] Full error:', JSON.stringify(error, null, 2));
          console.log('[Global IAP] =====================================');
        });

      } catch (iapErr) {
        console.warn('[Global IAP] Registering listeners failed:', iapErr);
      }
    };

    setupIAPListeners();

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
    };
  }, [token, userData]);

  return null;
};

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId,
    });

    const initNotifications = async () => {
      const unsubscribeMessaging = listenForForegroundMessages();
      const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
        async ({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log('Notification pressed in Foreground!', detail.notification);
            let placeDetails = detail.notification?.data?.placeDetails;
            const placeId = detail.notification?.data?.placeId || detail.notification?.data?.place_id;
            const isFromWelcomeBack = detail.notification?.data?.actionType === 'Go Again';
            const isFromAvoid = detail.notification?.data?.actionType === 'Avoid';

            if (!placeDetails && placeId) {
              placeDetails = { placeId };
            }

            if (placeDetails) {
              const parsedDetails = typeof placeDetails === 'string' ? JSON.parse(placeDetails) : placeDetails;
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

    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        let placeDetails = initialNotification.notification?.data?.placeDetails;
        const placeId = initialNotification.notification?.data?.placeId || initialNotification.notification?.data?.place_id;
        const isFromWelcomeBack = initialNotification.notification?.data?.actionType === 'Go Again';
        const isFromAvoid = initialNotification.notification?.data?.actionType === 'Avoid';

        if (!placeDetails && placeId) {
          placeDetails = { placeId };
        }

        if (placeDetails) {
          const parsedDetails = typeof placeDetails === 'string' ? JSON.parse(placeDetails) : placeDetails;
          navigate('HomeDetails', {
            placeDetails: parsedDetails,
            isFromWelcomeBack,
            isFromAvoid,
          });
        }
      }
    };

    const cleanup = initNotifications();
    checkInitialNotification();

    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer ref={navigationRef}>
          <BackgroundManager />
          <Routes />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default withIAPContext(App);
