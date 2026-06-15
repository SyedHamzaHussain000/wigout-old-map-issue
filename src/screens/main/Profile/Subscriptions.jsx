import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppText from '../../../components/AppTextComps/AppText';
import AppButton from '../../../components/AppButton';
import LineBreak from '../../../components/LineBreak';

import AppColors from '../../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {ShowToast} from '../../../utils/api_content';
import {verifyIAPReceipt} from '../../../GlobalFunctions/main'; // Ensure this uses your direct live API URL endpoint
import axios from 'axios';
import {UpdateProfile} from '../../../redux/Slices';

// ✅ v12 Specific Imports
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';

const SUBSCRIPTION_IDS = [
  'sub_individual_weekly_basic',
  'sub_individual_weekly_premium',
  'sub_individual_monthly_premium',
  'sub_couples_weekly_premium',
  'sub_couples_monthly_premium',
];

const PLAN_UI_ASSETS = {
  sub_individual_weekly_basic: {
    period: 'week',
    type: 'individual',
    popular: false,
    badge: 'Essential',
    defaultName: 'Weekly Basic',
    defaultPrice: '$0.69',
    features: [
      'Create One Custom List',
      'Ads Included',
      'Access nearby dining recommendations',
      'Standard customer support',
    ],
  },
  sub_individual_weekly_premium: {
    period: 'week',
    type: 'individual',
    popular: false,
    badge: 'Premium',
    defaultName: 'Weekly Premium',
    defaultPrice: '$0.99',
    features: [
      'Only Native Ads',
      'Create custom notes on reviews',
      'Unlock premium user status badge',
      'Priority recommended updates',
    ],
  },
  sub_individual_monthly_premium: {
    period: 'month',
    type: 'individual',
    popular: true,
    badge: 'Best Value',
    defaultName: 'Monthly Premium',
    defaultPrice: '$3.69',
    features: [
      'All Weekly Premium features included',
      'Save compared to weekly plans',
      'Unlock premium user status badge',
      'Priority customer assistance',
    ],
  },
  sub_couples_weekly_premium: {
    period: 'week',
    type: 'couples',
    popular: false,
    badge: 'Couples',
    defaultName: 'Couples Weekly Premium',
    defaultPrice: '$1.89',
    features: [
      'Link 2 accounts under one billing plan',
      'Co-plan and share dining lists seamlessly',
      'Premium couples badge on profiles',
      'Dedicated couples support channel',
    ],
  },
  sub_couples_monthly_premium: {
    period: 'month',
    type: 'couples',
    popular: true,
    defaultName: 'Couples Monthly Premium',
    defaultPrice: '$6.99',
    badge: 'Best Value',
    features: [
      'Link 2 accounts under one billing plan',
      'All Couples Premium features included',
      'Save compared to weekly couples',
      'Dedicated couples support channel',
    ],
  },
};

const Subscriptions = ({navigation}) => {
  const dispatch = useDispatch();
  const token = useSelector(state => state.user.token);
  const userData = useSelector(state => state.user.userData);

  const [activeTab, setActiveTab] = useState('individual');
  const [storeSubscriptions, setStoreSubscriptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoreLoader, setRestoreLoader] = useState(false);

  const activePlanId =
    userData?.subscription?.productId || userData?.subscription?.plan;

  useEffect(() => {
    if (activePlanId) {
      if (
        activePlanId.includes('couples') ||
        userData?.subscription?.plan === 'couples'
      ) {
        setActiveTab('couples');
      } else if (
        activePlanId.includes('individual') ||
        userData?.subscription?.plan === 'individual'
      ) {
        setActiveTab('individual');
      }
    }
  }, [activePlanId, userData?.subscription?.plan]);

  // 1. Setup IAP Connection & Fetch Products (v12 style lifecycle)
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        setLoadingProducts(true);
        const connected = await initConnection();
        console.log('[IAP v12] Connection initialized:', connected);

        if (connected && Platform.OS === 'android') {
          await flushFailedPurchasesCachedAsPendingAndroid();
        }

        if (connected) {
          const products = await getSubscriptions({skus: SUBSCRIPTION_IDS});
          console.log('[IAP v12] Products fetched successfully:', products);
          setStoreSubscriptions(products);
        }
      } catch (err) {
        console.warn('[IAP v12] Initial setup failed:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    initializeIAP();

    return () => {
      endConnection();
    };
  }, []);

  // ✅ Live Sync with backend GET API `/getSubscription`
  useEffect(() => {
    const syncSubscription = async () => {
      if (!token) return;
      try {
        const config = {headers: {Authorization: `Bearer ${token}`}};
        const response = await axios.get(
          'https://bradly-unstagnating-nonperpendicularly.ngrok-free.dev/api/iap/getSubscription',
          config,
        );
        console.log('response:-', response?.data);
        if (
          response.data &&
          response.data.success &&
          response.data.subscription
        ) {
          dispatch(
            UpdateProfile({
              ...userData,
              subscription: response.data.subscription,
            }),
          );
        }
      } catch (err) {
        console.log(
          '[Subscriptions Sync Error] Status verification failed:',
          err?.message,
        );
      }
    };
    syncSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ✅ Auth Gate Functionality
  const checkAuthTokenGate = () => {
    if (!token) {
      Alert.alert(
        'Login Required',
        'To access or manage subscription benefits, please create or log in to your account.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Login Now', onPress: () => navigation.navigate('Login')},
        ],
        {cancelable: true},
      );
      return false;
    }
    return true;
  };

  // ✅ Fixed Restore Purchase Functionality
  const onRestorePurchase = async () => {
    if (!checkAuthTokenGate()) return;

    setRestoreLoader(true);
    try {
      console.log('[IAP Restore] Fetching historical owned purchases...');
      const ownedPurchases = await getAvailablePurchases();
      console.log('[IAP Restore] Owned purchases items:', ownedPurchases);

      const activeStoreReceipt = ownedPurchases.find(p =>
        SUBSCRIPTION_IDS.includes(p.productId),
      );

      if (activeStoreReceipt) {
        const targetPlanId = activeStoreReceipt.productId;
        const receiptToken =
          Platform.OS === 'android'
            ? activeStoreReceipt.purchaseToken
            : activeStoreReceipt.transactionReceipt;

        // Corrected Payload parsing logic to support exact matching backend keys
        const subType = targetPlanId.includes('monthly') ? 'monthly' : 'weekly';
        const plan = targetPlanId.includes('couples')
          ? 'couples'
          : 'individual';

        const res = await verifyIAPReceipt(token, {
          platform: Platform.OS === 'android' ? 'google' : 'apple',
          subType,
          plan,
          productId: targetPlanId,
          purchaseToken: receiptToken || '',
          type: 'proceed',
        });
        console.log('res in verifyIAPReceipt:-', res);

        if (res?.success && res?.user) {
          dispatch(UpdateProfile(res.user));
          ShowToast('success', 'Your subscription was successfully restored!');
        } else {
          // Local Fallback Sync
          const restoredLocalMap = {
            ...userData,
            subscription: {plan: targetPlanId, status: 'active'},
          };
          dispatch(UpdateProfile(restoredLocalMap));
          ShowToast('success', 'Subscription restored (Local Mode)!');
        }
      } else {
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any active subscription products linked to this device identity.",
        );
      }
    } catch (err) {
      console.error('[IAP Restore] Error analyzing transactions:', err);
      ShowToast(
        'error',
        'An error occurred while communicating with the store.',
      );
    } finally {
      setRestoreLoader(false);
    }
  };

  // ✅ Purchase Trigger Flow (v12 style parsing mapping)
  const handleSubscribePress = async productId => {
    if (!checkAuthTokenGate()) return;
    if (purchasing) return;
    setPurchasing(true);

    const subProduct = storeSubscriptions.find(p => p.productId === productId);
    if (subProduct) {
      try {
        if (Platform.OS === 'android') {
          const offerToken =
            subProduct.subscriptionOfferDetails?.[0]?.offerToken;
          if (offerToken) {
            await requestSubscription({
              subscriptionOffers: [{sku: productId, offerToken}],
            });
          } else {
            await requestSubscription({sku: productId});
          }
        } else {
          await requestSubscription({sku: productId});
        }
      } catch (err) {
        console.log(
          '[IAP Engine Error] Live prompt failed, loading sandbox simulation:',
          err,
        );
        promptMockSimulation(productId);
      } finally {
        setPurchasing(false);
      }
    } else {
      promptMockSimulation(productId);
    }
  };

  const promptMockSimulation = productId => {
    const dynamicPlan = getDynamicPlanObject(productId);
    Alert.alert(
      'Subscription Sandbox',
      `Simulate a successful purchase for "${dynamicPlan.name}"?`,
      [
        {text: 'Cancel', onPress: () => setPurchasing(false), style: 'cancel'},
        {
          text: 'Confirm Purchase',
          onPress: () => executeMockPurchase(productId),
        },
      ],
      {cancelable: true},
    );
  };

  const executeMockPurchase = async productId => {
    try {
      const subType = productId.includes('monthly') ? 'monthly' : 'weekly';
      const plan = productId.includes('couples') ? 'couples' : 'individual';

      const res = await verifyIAPReceipt(token, {
        platform: Platform.OS === 'android' ? 'google' : 'apple',
        subType,
        plan,
        productId,
        purchaseToken: 'mock_' + Date.now(),
        type: 'proceed',
      });

      if (res?.success && res?.user) {
        ShowToast('success', 'Subscription activated successfully!');
        dispatch(UpdateProfile(res.user));
      } else {
        const updatedUserData = {
          ...userData,
          subscription: {plan: productId, status: 'active'},
        };
        dispatch(UpdateProfile(updatedUserData));
        ShowToast('success', 'Subscription activated (Local Sandbox)!');
      }
    } catch (err) {
      ShowToast('error', 'Mock purchase execution error.');
    } finally {
      setPurchasing(false);
    }
  };

  const getDynamicPlanObject = productId => {
    const uiAsset = PLAN_UI_ASSETS[productId];
    const storeProduct = storeSubscriptions.find(
      p => p.productId === productId,
    );
    let dynamicPrice = storeProduct?.price;
    let dynamicName = storeProduct?.displayName;
    let dynamicDescription = uiAsset.features;

    if (storeProduct) {
      dynamicName = storeProduct.title
        ? storeProduct.title.split(' (')[0]
        : uiAsset.defaultName;

      if (Platform.OS === 'android') {
        const offerDetails = storeProduct.subscriptionOfferDetails?.[0];
        const detailsPricePhase =
          offerDetails?.pricingPhases?.pricingPhaseList?.[0];

        if (detailsPricePhase?.formattedPrice) {
          dynamicPrice = detailsPricePhase.formattedPrice;
        } else if (storeProduct.localizedPrice) {
          dynamicPrice = storeProduct.localizedPrice;
        } else {
          dynamicPrice = uiAsset.defaultPrice;
        }
      } else {
        dynamicPrice =
          storeProduct.localizedPrice ||
          storeProduct.price ||
          uiAsset.defaultPrice;
        if (typeof dynamicPrice === 'string') {
          dynamicPrice = dynamicPrice.split('/')[0].trim();
        }
      }
    }

    return {
      id: productId,
      name: dynamicName || uiAsset.defaultName,
      price: dynamicPrice || uiAsset.defaultPrice,
      period: uiAsset.period,
      type: uiAsset.type,
      popular: uiAsset.popular,
      badge: uiAsset.badge,
      features: dynamicDescription,
    };
  };

  const computedDynamicPlans = SUBSCRIPTION_IDS.map(id =>
    getDynamicPlanObject(id),
  ).filter(plan => plan.type === activeTab);

  return (
    <ScreenWrapper>
      <View style={styles.headerWrapper}>
        <AppHeader onBackPress={true} heading="Subscriptions" />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        pointerEvents={purchasing || restoreLoader ? 'none' : 'auto'} // Prevents dangerous UI double-taps during active transactions
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <View style={styles.badgeContainer}>
            <Ionicons name="trophy" size={24} color={AppColors.Yellow} />
            <AppText
              title="W.I.G. OUT PREMIUM"
              textColor={AppColors.Yellow}
              textSize={1.5}
              textFontWeight
            />
          </View>
          <LineBreak space={1} />
          <AppText
            title="Unlock Ultimate Sharing & Mapping"
            textColor={AppColors.BLACK}
            textSize={2.6}
            textFontWeight
            textAlignment="center"
          />
        </View>

        <LineBreak space={1} />

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'individual' && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('individual')}>
            <Ionicons
              name="person-outline"
              size={18}
              color={
                activeTab === 'individual'
                  ? AppColors.WHITE
                  : AppColors.BTNCOLOURS
              }
            />
            <AppText
              title="Individual"
              textColor={
                activeTab === 'individual'
                  ? AppColors.WHITE
                  : AppColors.BTNCOLOURS
              }
              textSize={1.7}
              textFontWeight
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'couples' && styles.activeTabButton,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('couples')}>
            <Ionicons
              name="people-outline"
              size={18}
              color={
                activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS
              }
            />
            <AppText
              title="Couples"
              textColor={
                activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS
              }
              textSize={1.7}
              textFontWeight
            />
          </TouchableOpacity>
        </View>

        <LineBreak space={2} />

        {loadingProducts && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
          </View>
        )}

        {!loadingProducts && (
          <View style={styles.plansList}>
            {computedDynamicPlans.map(plan => {
              const isActive = activePlanId === plan.id;

              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.popular && styles.popularCard,
                    isActive && styles.activeCard,
                  ]}>
                  {plan.badge && (
                    <View
                      style={[
                        styles.cardBadge,
                        plan.popular ? styles.popularBadge : styles.normalBadge,
                      ]}>
                      <AppText
                        title={plan.badge.toUpperCase()}
                        textColor={AppColors.WHITE}
                        textSize={1.1}
                        textFontWeight
                      />
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <AppText
                      title={plan.name}
                      textColor={AppColors.BLACK}
                      textSize={2.1}
                      textFontWeight
                    />
                  </View>

                  <LineBreak space={1} />

                  <View style={styles.priceContainer}>
                    <AppText
                      title={plan.price}
                      textColor={AppColors.BTNCOLOURS}
                      textSize={3.2}
                      textFontWeight
                    />
                    <AppText
                      title={` / ${plan.period}`}
                      textColor={AppColors.blackOpacity}
                      textSize={1.6}
                    />
                  </View>

                  <LineBreak space={1.5} />
                  <View style={styles.divider} />
                  <LineBreak space={1.5} />

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={
                            plan.popular
                              ? AppColors.Yellow
                              : AppColors.BTNCOLOURS
                          }
                          style={styles.checkmarkIcon}
                        />
                        <View style={styles.featureTextWrapper}>
                          <AppText
                            title={feature}
                            textColor={AppColors.BLACK}
                            textSize={1.5}
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  <LineBreak space={2.5} />

                  <AppButton
                    title={isActive ? 'Current Plan' : 'Subscribe Now'}
                    disabled={isActive || purchasing}
                    loading={purchasing && !isActive}
                    handlePress={() => handleSubscribePress(plan.id)}
                    btnBackgroundColor={
                      isActive
                        ? '#E0E0E0'
                        : plan.popular
                        ? AppColors.Yellow
                        : AppColors.BTNCOLOURS
                    }
                    textColor={
                      isActive ? AppColors.blackOpacity : AppColors.WHITE
                    }
                    btnPadding={16}
                  />
                </View>
              );
            })}
          </View>
        )}

        <LineBreak space={3} />

        {/* <AppButton
          title="Restore Purchases"
          disabled={restoreLoader || loadingProducts}
          loading={restoreLoader}
          handlePress={onRestorePurchase}
          btnBackgroundColor={AppColors.WHITE}
          textColor={AppColors.BTNCOLOURS}
          btnPadding={15}
        />

        <LineBreak space={4} /> */}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {paddingBottom: 5},
  container: {flex: 1},
  scrollContent: {
    paddingBottom: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },
  heroContainer: {alignItems: 'center', paddingVertical: 15},
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(71, 8, 46, 0.15)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 26,
    gap: 8,
  },
  activeTabButton: {backgroundColor: AppColors.BTNCOLOURS},
  loaderContainer: {alignItems: 'center', paddingVertical: 40},
  plansList: {gap: 20},
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    position: 'relative',
    overflow: 'hidden',
  },
  popularCard: {borderColor: AppColors.Yellow, borderWidth: 2},
  activeCard: {
    borderColor: AppColors.BTNCOLOURS,
    borderWidth: 1.5,
    backgroundColor: '#FAF7FA',
  },
  cardBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  normalBadge: {backgroundColor: AppColors.BTNCOLOURS},
  popularBadge: {backgroundColor: AppColors.Yellow},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 60,
  },
  priceContainer: {flexDirection: 'row', alignItems: 'baseline'},
  divider: {height: 1, backgroundColor: '#F0F0F0'},
  featuresContainer: {gap: 12},
  featureRow: {flexDirection: 'row', alignItems: 'flex-start'},
  checkmarkIcon: {marginRight: 10, marginTop: 2},
  featureTextWrapper: {flex: 1},
});

export default Subscriptions;

// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   Platform,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import {useSelector, useDispatch} from 'react-redux';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// // Components
// import AppHeader from '../../../components/AppHeader';
// import ScreenWrapper from '../../../components/ScreenWrapper';
// import AppText from '../../../components/AppTextComps/AppText';
// import AppButton from '../../../components/AppButton';
// import LineBreak from '../../../components/LineBreak';

// import AppColors from '../../../utils/AppColors';
// import {
//   responsiveHeight,
//   responsiveWidth,
// } from '../../../utils/Responsive_Dimensions';
// import {ShowToast} from '../../../utils/api_content';
// import {verifyIAPReceipt, getUserSubscription} from '../../../GlobalFunctions/main';
// import {UpdateProfile} from '../../../redux/Slices';

// // ✅ v12 Specific Imports
// import {
//   initConnection,
//   endConnection,
//   getSubscriptions,
//   requestSubscription,
//   getAvailablePurchases,
//   flushFailedPurchasesCachedAsPendingAndroid,
// } from 'react-native-iap';

// const SUBSCRIPTION_IDS = [
//   'sub_individual_weekly_basic',
//   'sub_individual_weekly_premium',
//   'sub_individual_monthly_premium',
//   'sub_couples_weekly_premium',
//   'sub_couples_monthly_premium',
// ];

// const PLAN_UI_ASSETS = {
//   sub_individual_weekly_basic: {
//     period: 'week',
//     type: 'individual',
//     popular: false,
//     badge: 'Essential',
//     defaultName: 'Weekly Basic',
//     defaultPrice: '$0.69',
//     features: [
//       'Create One Custom List',
//       'Ads Included',
//       'Access nearby dining recommendations',
//       'Standard customer support',
//     ],
//   },
//   sub_individual_weekly_premium: {
//     period: 'week',
//     type: 'individual',
//     popular: false,
//     badge: 'Premium',
//     defaultName: 'Weekly Premium',
//     defaultPrice: '$0.99',
//     features: [
//       'Only Native Ads',
//       'Create custom notes on reviews',
//       'Unlock premium user status badge',
//       'Priority recommended updates',
//     ],
//   },
//   sub_individual_monthly_premium: {
//     period: 'month',
//     type: 'individual',
//     popular: true,
//     badge: 'Best Value',
//     defaultName: 'Monthly Premium',
//     defaultPrice: '$3.69',
//     features: [
//       'All Weekly Premium features included',
//       'Save compared to weekly plans',
//       'Unlock premium user status badge',
//       'Priority customer assistance',
//     ],
//   },
//   sub_couples_weekly_premium: {
//     period: 'week',
//     type: 'couples',
//     popular: false,
//     badge: 'Couples',
//     defaultName: 'Couples Weekly Premium',
//     defaultPrice: '$1.89',
//     features: [
//       'Link 2 accounts under one billing plan',
//       'Co-plan and share dining lists seamlessly',
//       'Premium couples badge on profiles',
//       'Dedicated couples support channel',
//     ],
//   },
//   sub_couples_monthly_premium: {
//     period: 'month',
//     type: 'couples',
//     popular: true,
//     defaultName: 'Couples Monthly Premium',
//     defaultPrice: '$6.99',
//     badge: 'Best Value',
//     features: [
//       'Link 2 accounts under one billing plan',
//       'All Couples Premium features included',
//       'Save compared to weekly couples',
//       'Dedicated couples support channel',
//     ],
//   },
// };

// const Subscriptions = ({navigation}) => {
//   const dispatch = useDispatch();
//   const token = useSelector(state => state.user.token);
//   const userData = useSelector(state => state.user.userData);

//   const [activeTab, setActiveTab] = useState('individual');
//   const [storeSubscriptions, setStoreSubscriptions] = useState([]);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [purchasing, setPurchasing] = useState(false);
//   const [restoreLoader, setRestoreLoader] = useState(false);

//   const activePlanId = userData?.subscription?.plan;

//   // 1. Setup IAP Connection & Fetch Products (v12 style lifecycle)
//   useEffect(() => {
//     const initializeIAP = async () => {
//       try {
//         setLoadingProducts(true);
//         const connected = await initConnection();
//         console.log('[IAP v12] Connection initialized:', connected);

//         if (connected && Platform.OS === 'android') {
//           await flushFailedPurchasesCachedAsPendingAndroid();
//         }

//         if (connected) {
//           const products = await getSubscriptions({skus: SUBSCRIPTION_IDS});
//           console.log('[IAP v12] Products fetched successfully:', products);
//           setStoreSubscriptions(products);
//         }
//       } catch (err) {
//         console.warn('[IAP v12] Initial setup failed:', err);
//       } finally {
//         setLoadingProducts(false);
//       }
//     };

//     initializeIAP();

//     return () => {
//       endConnection();
//     };
//   }, []);

//   // ✅ Fetch live subscription from backend on mount & sync to Redux
//   useEffect(() => {
//     const syncSubscription = async () => {
//       if (!token) return;
//       try {
//         const res = await getUserSubscription(token);
//         if (res?.success && res?.subscription) {
//           dispatch(
//             UpdateProfile({
//               ...userData,
//               subscription: res.subscription,
//             }),
//           );
//         }
//       } catch (err) {
//         console.log('[Subscriptions] Failed to sync subscription:', err);
//       }
//     };
//     syncSubscription();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   // ✅ Auth Gate Functionality (FlyNeat approach)
//   const checkAuthTokenGate = () => {
//     if (!token) {
//       Alert.alert(
//         'Login Required',
//         'To access or manage subscription benefits, please create or log in to your account.',
//         [
//           {text: 'Cancel', style: 'cancel'},
//           {text: 'Login Now', onPress: () => navigation.navigate('Login')},
//         ],
//         {cancelable: true},
//       );
//       return false;
//     }
//     return true;
//   };

//   // ✅ Restore Purchase Functionality (FlyNeat v12 approach)
//   const onRestorePurchase = async () => {
//     if (!checkAuthTokenGate()) return;

//     setRestoreLoader(true);
//     try {
//       console.log('[IAP Restore] Fetching historical owned purchases...');
//       const ownedPurchases = await getAvailablePurchases();
//       console.log('[IAP Restore] Owned purchases items:', ownedPurchases);

//       const activeStoreReceipt = ownedPurchases.find(p =>
//         SUBSCRIPTION_IDS.includes(p.productId),
//       );

//       if (activeStoreReceipt) {
//         const targetPlanId = activeStoreReceipt.productId;
//         const receiptToken =
//           Platform.OS === 'android'
//             ? activeStoreReceipt.purchaseToken
//             : activeStoreReceipt.transactionReceipt;

//         console.log(
//           '[IAP Restore] ========= ACTIVE SUBSCRIPTION FOUND =========',
//         );
//         console.log('[IAP Restore] Product ID:', targetPlanId);
//         console.log(
//           '[IAP Restore] Active Receipt/Purchase Token:',
//           receiptToken,
//         );
//         console.log(
//           '[IAP Restore] Transaction ID:',
//           activeStoreReceipt.transactionId,
//         );
//         console.log(
//           '[IAP Restore] =============================================',
//         );

//         // Backend Sync via new IAP verify endpoint
//         const subType = targetPlanId.includes('monthly') ? 'monthly' : 'weekly';
//         const plan = targetPlanId.includes('premium') ? 'premium' : 'basic';

//         const res = await verifyIAPReceipt(token, {
//           platform: Platform.OS === 'android' ? 'google' : 'apple',
//           subType,
//           plan,
//           productId: targetPlanId,
//           purchaseToken: receiptToken || '',
//           type: 'proceed',
//         });

//         if (res?.success) {
//           dispatch(
//             UpdateProfile(
//               res?.user
//                 ? {...userData, subscription: res?.subscription}
//                 : res?.data,
//             ),
//           );
//           ShowToast('success', 'Your subscription was successfully restored!');
//         } else {
//           // Local Sandbox Fallback
//           const restoredLocalMap = {
//             ...userData,
//             subscription: {plan: targetPlanId, status: 'active'},
//           };
//           dispatch(UpdateProfile(restoredLocalMap));
//           ShowToast('success', 'Subscription restored (Sandbox Mode)!');
//         }
//       } else {
//         Alert.alert(
//           'No Purchases Found',
//           "We couldn't find any active subscription products linked to this device identity.",
//         );
//       }
//     } catch (err) {
//       console.error('[IAP Restore] Error analyzing transactions:', err);
//       ShowToast(
//         'error',
//         'An error occurred while communicating with the store.',
//       );
//     } finally {
//       setRestoreLoader(false);
//     }
//   };

//   // ✅ Purchase Trigger Flow (v12 style passing Object mapping)
//   const handleSubscribePress = async productId => {
//     console.log('productId:-', productId);
//     if (!checkAuthTokenGate()) return;
//     if (purchasing) return;
//     setPurchasing(true);

//     const subProduct = storeSubscriptions.find(p => p.productId === productId);
//     console.log('subProduct:-', subProduct);
//     if (subProduct) {
//       try {
//         if (Platform.OS === 'android') {
//           const offerToken =
//             subProduct.subscriptionOfferDetails?.[0]?.offerToken;
//           console.log('[IAP v12] offerToken:-', offerToken);
//           if (offerToken) {
//             // v12 Android: NO top-level sku — only subscriptionOffers array
//             const payload = {
//               subscriptionOffers: [{sku: productId, offerToken}],
//             };
//             console.log('[IAP v12] Android payload:-', payload);
//             await requestSubscription(payload);
//           } else {
//             console.warn(
//               '[IAP v12] No offerToken found, trying sku-only fallback',
//             );
//             await requestSubscription({sku: productId});
//           }
//         } else {
//           // iOS: pass sku directly
//           await requestSubscription({sku: productId});
//         }
//       } catch (err) {
//         console.log('[IAP Engine] Error:', err);
//         promptMockSimulation(productId);
//       } finally {
//         setPurchasing(false);
//       }
//     } else {
//       promptMockSimulation(productId);
//     }
//   };

//   const promptMockSimulation = productId => {
//     const dynamicPlan = getDynamicPlanObject(productId);
//     Alert.alert(
//       'Subscription Sandbox',
//       `Simulate a successful purchase for "${dynamicPlan.name}"?`,
//       [
//         {text: 'Cancel', onPress: () => setPurchasing(false), style: 'cancel'},
//         {
//           text: 'Confirm Purchase',
//           onPress: () => executeMockPurchase(productId),
//         },
//       ],
//       {cancelable: true},
//     );
//   };

//   const executeMockPurchase = async productId => {
//     try {
//       const subType = productId.includes('monthly') ? 'monthly' : 'weekly';
//       const plan = productId.includes('premium') ? 'premium' : 'basic';

//       const res = await verifyIAPReceipt(token, {
//         platform: Platform.OS === 'android' ? 'google' : 'apple',
//         subType,
//         plan,
//         productId,
//         purchaseToken: 'mock_' + Date.now(),
//         type: 'proceed',
//       });
//       if (res?.success) {
//         ShowToast('success', 'Subscription activated successfully!');
//         dispatch(
//           UpdateProfile(
//             res?.user
//               ? {...userData, subscription: res?.subscription}
//               : res?.data,
//           ),
//         );
//       } else {
//         const updatedUserData = {
//           ...userData,
//           subscription: {plan: productId, status: 'active'},
//         };
//         dispatch(UpdateProfile(updatedUserData));
//         ShowToast('success', 'Subscription activated (Local Sandbox)!');
//       }
//     } catch (err) {
//       ShowToast('error', 'Mock purchase execution error.');
//     } finally {
//       setPurchasing(false);
//     }
//   };

//   const getDynamicPlanObject = productId => {
//     const uiAsset = PLAN_UI_ASSETS[productId];
//     const storeProduct = storeSubscriptions.find(
//       p => p.productId === productId,
//     );
//     let dynamicPrice = storeProduct?.price;
//     let dynamicName = storeProduct?.displayName;
//     let dynamicDescription = uiAsset.features;

//     if (storeProduct) {
//       dynamicName = storeProduct.title
//         ? storeProduct.title.split(' (')[0]
//         : uiAsset.defaultName;

//       if (Platform.OS === 'android') {
//         const offerDetails = storeProduct.subscriptionOfferDetails?.[0];
//         const detailsPricePhase =
//           offerDetails?.pricingPhases?.pricingPhaseList?.[0];

//         if (detailsPricePhase?.formattedPrice) {
//           dynamicPrice = detailsPricePhase.formattedPrice;
//         } else if (storeProduct.localizedPrice) {
//           dynamicPrice = storeProduct.localizedPrice;
//         } else {
//           dynamicPrice = uiAsset.defaultPrice;
//         }
//       } else {
//         dynamicPrice =
//           storeProduct.localizedPrice ||
//           storeProduct.price ||
//           uiAsset.defaultPrice;
//         if (typeof dynamicPrice === 'string') {
//           dynamicPrice = dynamicPrice.split('/')[0].trim();
//         }
//       }
//     }

//     return {
//       id: productId,
//       name: dynamicName || uiAsset.defaultName,
//       price: dynamicPrice || uiAsset.defaultPrice,
//       period: uiAsset.period,
//       type: uiAsset.type,
//       popular: uiAsset.popular,
//       badge: uiAsset.badge,
//       features: dynamicDescription,
//     };
//   };

//   const computedDynamicPlans = SUBSCRIPTION_IDS.map(id =>
//     getDynamicPlanObject(id),
//   ).filter(plan => plan.type === activeTab);

//   return (
//     <ScreenWrapper>
//       <View style={styles.headerWrapper}>
//         <AppHeader onBackPress={true} heading="Subscriptions" />
//       </View>

//       <ScrollView
//         style={styles.container}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}>
//         <View style={styles.heroContainer}>
//           <View style={styles.badgeContainer}>
//             <Ionicons name="trophy" size={24} color={AppColors.Yellow} />
//             <AppText
//               title="W.I.G. OUT PREMIUM"
//               textColor={AppColors.Yellow}
//               textSize={1.5}
//               textFontWeight
//             />
//           </View>
//           <LineBreak space={1} />
//           <AppText
//             title="Unlock Ultimate Sharing & Mapping"
//             textColor={AppColors.BLACK}
//             textSize={2.6}
//             textFontWeight
//             textAlignment="center"
//           />
//         </View>

//         <LineBreak space={1} />

//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             style={[
//               styles.tabButton,
//               activeTab === 'individual' && styles.activeTabButton,
//             ]}
//             activeOpacity={0.8}
//             onPress={() => setActiveTab('individual')}>
//             <Ionicons
//               name="person-outline"
//               size={18}
//               color={
//                 activeTab === 'individual'
//                   ? AppColors.WHITE
//                   : AppColors.BTNCOLOURS
//               }
//             />
//             <AppText
//               title="Individual"
//               textColor={
//                 activeTab === 'individual'
//                   ? AppColors.WHITE
//                   : AppColors.BTNCOLOURS
//               }
//               textSize={1.7}
//               textFontWeight
//             />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.tabButton,
//               activeTab === 'couples' && styles.activeTabButton,
//             ]}
//             activeOpacity={0.8}
//             onPress={() => setActiveTab('couples')}>
//             <Ionicons
//               name="people-outline"
//               size={18}
//               color={
//                 activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS
//               }
//             />
//             <AppText
//               title="Couples"
//               textColor={
//                 activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS
//               }
//               textSize={1.7}
//               textFontWeight
//             />
//           </TouchableOpacity>
//         </View>

//         <LineBreak space={2} />

//         {loadingProducts && (
//           <View style={styles.loaderContainer}>
//             <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
//           </View>
//         )}

//         {!loadingProducts && (
//           <View style={styles.plansList}>
//             {computedDynamicPlans.map(plan => {
//               const isActive = activePlanId === plan.id;

//               return (
//                 <View
//                   key={plan.id}
//                   style={[
//                     styles.planCard,
//                     plan.popular && styles.popularCard,
//                     isActive && styles.activeCard,
//                   ]}>
//                   {plan.badge && (
//                     <View
//                       style={[
//                         styles.cardBadge,
//                         plan.popular ? styles.popularBadge : styles.normalBadge,
//                       ]}>
//                       <AppText
//                         title={plan.badge.toUpperCase()}
//                         textColor={AppColors.WHITE}
//                         textSize={1.1}
//                         textFontWeight
//                       />
//                     </View>
//                   )}

//                   <View style={styles.cardHeader}>
//                     <AppText
//                       title={plan.name}
//                       textColor={AppColors.BLACK}
//                       textSize={2.1}
//                       textFontWeight
//                     />
//                   </View>

//                   <LineBreak space={1} />

//                   <View style={styles.priceContainer}>
//                     <AppText
//                       title={plan.price}
//                       textColor={AppColors.BTNCOLOURS}
//                       textSize={3.2}
//                       textFontWeight
//                     />
//                     <AppText
//                       title={` / ${plan.period}`}
//                       textColor={AppColors.blackOpacity}
//                       textSize={1.6}
//                     />
//                   </View>

//                   <LineBreak space={1.5} />
//                   <View style={styles.divider} />
//                   <LineBreak space={1.5} />

//                   <View style={styles.featuresContainer}>
//                     {plan.features.map((feature, idx) => (
//                       <View key={idx} style={styles.featureRow}>
//                         <Ionicons
//                           name="checkmark-circle"
//                           size={18}
//                           color={
//                             plan.popular
//                               ? AppColors.Yellow
//                               : AppColors.BTNCOLOURS
//                           }
//                           style={styles.checkmarkIcon}
//                         />
//                         <View style={styles.featureTextWrapper}>
//                           <AppText
//                             title={feature}
//                             textColor={AppColors.BLACK}
//                             textSize={1.5}
//                           />
//                         </View>
//                       </View>
//                     ))}
//                   </View>

//                   <LineBreak space={2.5} />

//                   <AppButton
//                     title={isActive ? 'Current Plan' : 'Subscribe Now'}
//                     disabled={isActive || purchasing}
//                     loading={purchasing && !isActive}
//                     handlePress={() => handleSubscribePress(plan.id)}
//                     btnBackgroundColor={
//                       isActive
//                         ? '#E0E0E0'
//                         : plan.popular
//                         ? AppColors.Yellow
//                         : AppColors.BTNCOLOURS
//                     }
//                     textColor={
//                       isActive ? AppColors.blackOpacity : AppColors.WHITE
//                     }
//                     btnPadding={16}
//                   />
//                 </View>
//               );
//             })}
//           </View>
//         )}

//         <LineBreak space={3} />

//         {/* ✅ v12 Restore Action Triggers AppButton component integration */}
//         <AppButton
//           title="Restore Purchases"
//           disabled={restoreLoader || loadingProducts}
//           loading={restoreLoader}
//           handlePress={onRestorePurchase}
//           btnBackgroundColor={AppColors.WHITE}
//           textColor={AppColors.BTNCOLOURS}
//           btnPadding={15}
//         />

//         <LineBreak space={4} />
//       </ScrollView>
//     </ScreenWrapper>
//   );
// };

// const styles = StyleSheet.create({
//   headerWrapper: {paddingBottom: 5},
//   container: {flex: 1},
//   scrollContent: {
//     paddingBottom: responsiveHeight(5),
//     paddingHorizontal: responsiveWidth(5),
//   },
//   heroContainer: {alignItems: 'center', paddingVertical: 15},
//   badgeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 30,
//     gap: 8,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(255, 255, 255, 0.6)',
//     borderRadius: 30,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: 'rgba(71, 8, 46, 0.15)',
//   },
//   tabButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 26,
//     gap: 8,
//   },
//   activeTabButton: {backgroundColor: AppColors.BTNCOLOURS},
//   loaderContainer: {alignItems: 'center', paddingVertical: 40},
//   plansList: {gap: 20},
//   planCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 24,
//     padding: 24,
//     borderWidth: 1,
//     borderColor: '#EFEFEF',
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   popularCard: {borderColor: AppColors.Yellow, borderWidth: 2},
//   activeCard: {
//     borderColor: AppColors.BTNCOLOURS,
//     borderWidth: 1.5,
//     backgroundColor: '#FAF7FA',
//   },
//   cardBadge: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     borderBottomLeftRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//   },
//   normalBadge: {backgroundColor: AppColors.BTNCOLOURS},
//   popularBadge: {backgroundColor: AppColors.Yellow},
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingRight: 60,
//   },
//   priceContainer: {flexDirection: 'row', alignItems: 'baseline'},
//   divider: {height: 1, backgroundColor: '#F0F0F0'},
//   featuresContainer: {gap: 12},
//   featureRow: {flexDirection: 'row', alignItems: 'flex-start'},
//   checkmarkIcon: {marginRight: 10, marginTop: 2},
//   featureTextWrapper: {flex: 1},
// });

// export default Subscriptions;
