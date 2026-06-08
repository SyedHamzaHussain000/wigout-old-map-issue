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
import {subscribeUser} from '../../../GlobalFunctions/main';
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
      'Share lists with up to 2 friends',
      'Standard custom list builder',
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
      'Share lists with unlimited friends',
      'No ads / ad-free experience',
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
    defaultPrice: '$3.96',
    features: [
      'All Weekly Premium features included',
      'Save 30% compared to weekly plans',
      'Ad-free premium mapping service',
      'Unlimited list sharing & access',
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
      'No ads for both connected profiles',
      'Premium couples badge on profiles',
      'Custom notes & maps for two users',
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
      'Save 30% compared to weekly couples',
      'Unlimited sharing & map co-planning',
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

  const activePlanId = userData?.subscription?.plan;

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

  // ✅ Auth Gate Functionality (FlyNeat approach)
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

  // ✅ Restore Purchase Functionality (FlyNeat v12 approach)
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

        console.log('[IAP Restore] ========= ACTIVE SUBSCRIPTION FOUND =========');
        console.log('[IAP Restore] Product ID:', targetPlanId);
        console.log('[IAP Restore] Active Receipt/Purchase Token:', receiptToken);
        console.log('[IAP Restore] Transaction ID:', activeStoreReceipt.transactionId);
        console.log('[IAP Restore] =============================================');

        // Backend Sync
        const res = await subscribeUser(
          token,
          targetPlanId,
          receiptToken,
          activeStoreReceipt.transactionId || 'restored_sync',
        );

        if (res?.success) {
          dispatch(UpdateProfile(res?.data));
          ShowToast('success', 'Your subscription was successfully restored!');
        } else {
          // Local Sandbox Fallback
          const restoredLocalMap = {
            ...userData,
            subscription: {plan: targetPlanId, status: 'active'},
          };
          dispatch(UpdateProfile(restoredLocalMap));
          ShowToast('success', 'Subscription restored (Sandbox Mode)!');
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

  // ✅ Purchase Trigger Flow (v12 style passing Object mapping)
  const handleSubscribePress = async productId => {
    console.log('productId:-', productId);
    if (!checkAuthTokenGate()) return;
    if (purchasing) return;
    setPurchasing(true);

    const subProduct = storeSubscriptions.find(p => p.productId === productId);
    console.log('subProduct:-', subProduct);
    if (subProduct) {
      try {
        if (Platform.OS === 'android') {
          const offerToken =
            subProduct.subscriptionOfferDetails?.[0]?.offerToken;
          console.log('[IAP v12] offerToken:-', offerToken);
          if (offerToken) {
            // v12 Android: NO top-level sku — only subscriptionOffers array
            const payload = {
              subscriptionOffers: [{sku: productId, offerToken}],
            };
            console.log('[IAP v12] Android payload:-', payload);
            await requestSubscription(payload);
          } else {
            console.warn(
              '[IAP v12] No offerToken found, trying sku-only fallback',
            );
            await requestSubscription({sku: productId});
          }
        } else {
          // iOS: pass sku directly
          await requestSubscription({sku: productId});
        }
      } catch (err) {
        console.log('[IAP Engine] Error:', err);
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
      const res = await subscribeUser(
        token,
        productId,
        'mock_' + Date.now(),
        'mock_' + Date.now(),
      );
      if (res?.success) {
        ShowToast('success', 'Subscription activated successfully!');
        dispatch(UpdateProfile(res?.data));
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

        {/* ✅ v12 Restore Action Triggers AppButton component integration */}
        <AppButton
          title="Restore Purchases"
          disabled={restoreLoader || loadingProducts}
          loading={restoreLoader}
          handlePress={onRestorePurchase}
          btnBackgroundColor={AppColors.WHITE}
          textColor={AppColors.BTNCOLOURS}
          btnPadding={15}
        />

        <LineBreak space={4} />
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

// withIAPContext is applied at App level (App.tsx) — do NOT wrap here again
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
// import {subscribeUser} from '../../../GlobalFunctions/main';
// import {UpdateProfile} from '../../../redux/Slices';

// // ✅ Imports Updated according to package version architecture
// import {
//   initConnection,
//   fetchProducts,
//   requestPurchase,
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
//     defaultPrice: '$0.00',
//     features: [
//       'Share lists with up to 2 friends',
//       'Standard custom list builder',
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
//       'Share lists with unlimited friends',
//       'No ads / ad-free experience',
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
//     defaultPrice: '$3.96',
//     features: [
//       'All Weekly Premium features included',
//       'Save 30% compared to weekly plans',
//       'Ad-free premium mapping service',
//       'Unlimited list sharing & access',
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
//       'No ads for both connected profiles',
//       'Premium couples badge on profiles',
//       'Custom notes & maps for two users',
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
//       'Save 30% compared to weekly couples',
//       'Unlimited sharing & map co-planning',
//       'Dedicated couples support channel',
//     ],
//   },
// };

// const Subscriptions = ({navigation}) => {
//   const dispatch = useDispatch();
//   const token = useSelector(state => state.user.token);
//   const userData = useSelector(state => state.user.userData);

//   const [activeTab, setActiveTab] = useState('individual');
//   const [subscriptionData, setSubscriptionData] = useState([]);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [purchasing, setPurchasing] = useState(false);

//   const activePlanId = userData?.subscription?.plan;

//   useEffect(() => {
//     const setupIAP = async () => {
//       try {
//         setLoadingProducts(true);
//         const connected = await initConnection();
//         console.log('IAP Native connection baseline established:', connected);

//         // Fetch products as subscription type for modern openiap package compatibility
//         const products = await fetchProducts({
//           skus: SUBSCRIPTION_IDS,
//           type: 'subs',
//         });
//         console.log('Fetched offers trace:', products);

//         if (products && products.length > 0) {
//           setSubscriptionData(products);
//         }
//       } catch (err) {
//         console.warn(
//           'IAP native fetch failed, handling fallback structures:',
//           err,
//         );
//       } finally {
//         setLoadingProducts(false);
//       }
//     };

//     setupIAP();
//   }, []);

//   const handleSubscribePress = async productId => {
//     console.log('productId:-', productId);
//     if (purchasing) return;
//     setPurchasing(true);

//     console.log('subscriptionData:-', subscriptionData);
//     const subProduct = subscriptionData.find(p => p.id === productId);
//     console.log('subProduct:-', subProduct);
//     if (subProduct) {
//       try {
//         if (Platform.OS === 'android') {
//           const offerToken =
//             subProduct.subscriptionOffers?.[0]?.offerTokenAndroid ||
//             subProduct.subscriptionOfferDetailsAndroid?.[0]?.offerToken;
//           console.log('offerToken:-', offerToken);
//           if (offerToken) {
//             let payload = {
//               type: 'subs',
//               request: {
//                 google: {
//                   skus: [productId],
//                   subscriptionOffers: [{sku: productId, offerToken}],
//                 },
//               },
//             };

//             console.log('payload1:-', payload);
//             await requestPurchase(payload);
//           } else {
//             let payload = {
//               type: 'subs',
//               request: {
//                 google: {
//                   skus: [productId],
//                 },
//               },
//             };
//             console.log('payload2:-', payload);
//             await requestPurchase(payload);
//           }
//         } else {
//           let payload = {
//             type: 'subs',
//             request: {
//               apple: {
//                 sku: productId,
//               },
//             },
//           };
//           console.log('payload3:-', payload);
//           await requestPurchase(payload);
//         }
//       } catch (err) {
//         console.log('Purchase requests bypass to mock engine:', err);
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
//       const res = await subscribeUser(
//         token,
//         productId,
//         'mock_' + Date.now(),
//         'mock_' + Date.now(),
//       );
//       if (res?.success) {
//         ShowToast('success', 'Subscription activated successfully!');
//         dispatch(UpdateProfile(res?.data));
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
//     const storeProduct = subscriptionData.find(p => p.id === productId);
//     // console.log('storeProduct:-', storeProduct);
//     let dynamicPrice = storeProduct?.price;
//     let dynamicName = storeProduct?.displayName;
//     let dynamicDescription = uiAsset.features;

//     if (storeProduct) {
//       // Use the name from store product (clean split for Google Play titles)
//       dynamicName = storeProduct.title
//         ? storeProduct.title.split(' (')[0]
//         : uiAsset.defaultName;

//       // Extract localized price without billing period duplication
//       if (Platform.OS === 'android') {
//         const offer = storeProduct.subscriptionOffers?.[0];
//         const offerPricePhase =
//           offer?.pricingPhasesAndroid?.pricingPhaseList?.[0];
//         const offerDetails = storeProduct.subscriptionOfferDetailsAndroid?.[0];
//         const detailsPricePhase =
//           offerDetails?.pricingPhases?.pricingPhaseList?.[0];

//         if (offerPricePhase?.formattedPrice) {
//           dynamicPrice = offerPricePhase.formattedPrice;
//         } else if (detailsPricePhase?.formattedPrice) {
//           dynamicPrice = detailsPricePhase.formattedPrice;
//         } else if (offer?.displayPrice) {
//           dynamicPrice = offer.displayPrice.split('/')[0].trim();
//         } else if (storeProduct.displayPrice) {
//           dynamicPrice = storeProduct.displayPrice.split('/')[0].trim();
//         }
//       } else {
//         dynamicPrice =
//           storeProduct.displayPrice ||
//           storeProduct.localizedPrice ||
//           storeProduct.price ||
//           uiAsset.defaultPrice;
//         if (typeof dynamicPrice === 'string') {
//           dynamicPrice = dynamicPrice.split('/')[0].trim();
//         }
//       }

//       // Convert full description text from store into line features
//       if (storeProduct.description) {
//         const parsedDesc = storeProduct.description.split(/[.,;\n]+/);
//         const mappedDesc = parsedDesc
//           .map(str => str.trim())
//           .filter(str => str.length > 0);
//         if (mappedDesc.length > 0) {
//           dynamicDescription = mappedDesc;
//         }
//       }
//     }

//     return {
//       id: productId,
//       name: dynamicName,
//       price: dynamicPrice,
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
//           <LineBreak space={1} />
//           <AppText
//             title="Share your custom place listings, map recommendations, and notes with friends and groups without limits."
//             textColor={AppColors.blackOpacity}
//             textSize={1.6}
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
//             <LineBreak space={1} />
//             <AppText
//               title="Loading Store Offers..."
//               textColor={AppColors.blackOpacity}
//             />
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
//                     {plan.popular && (
//                       <Ionicons
//                         name="star"
//                         size={20}
//                         color={AppColors.Yellow}
//                       />
//                     )}
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
//                     // handlePress={() => {}}
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

//         <View style={styles.footerNote}>
//           <AppText
//             title="Subscription Terms & Auto-Renewal Details:"
//             textColor={AppColors.blackOpacity}
//             textSize={1.3}
//             textFontWeight
//           />
//           <LineBreak space={0.5} />
//           <AppText
//             title="Subscriptions will automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period. Your account will be charged for renewal within 24-hours prior to the end of the current period. Manage or cancel your subscriptions in your mobile App Store or Google Play Store settings."
//             textColor={AppColors.blackOpacity}
//             textSize={1.2}
//             textAlignment="justify"
//           />
//         </View>

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
//     // backgroundColor: 'rgba(255, 156, 18, 0.1)',
//     backgroundColor: AppColors.appBgColor,
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
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.05,
//     shadowRadius: 3,
//     elevation: 2,
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
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 6},
//     shadowOpacity: 0.06,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   popularCard: {
//     borderColor: AppColors.Yellow,
//     borderWidth: 2,
//     shadowOpacity: 0.12,
//     shadowRadius: 14,
//   },
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
//   footerNote: {paddingHorizontal: 10, opacity: 0.75},
//   checkmarkIcon: {marginRight: 10, marginTop: 2},
//   featureTextWrapper: {flex: 1},
// });

// export default Subscriptions;

// // import React, { useState, useEffect } from 'react';
// // import {
// //   View,
// //   StyleSheet,
// //   ScrollView,
// //   Platform,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   Alert,
// // } from 'react-native';
// // import { useSelector, useDispatch } from 'react-redux';
// // import Ionicons from 'react-native-vector-icons/Ionicons';

// // // Components
// // import AppHeader from '../../../components/AppHeader';
// // import ScreenWrapper from '../../../components/ScreenWrapper';
// // import AppText from '../../../components/AppTextComps/AppText';
// // import AppButton from '../../../components/AppButton';
// // import LineBreak from '../../../components/LineBreak';

// // import AppColors from '../../../utils/AppColors';
// // import {
// //   responsiveHeight,
// //   responsiveWidth,
// // } from '../../../utils/Responsive_Dimensions';
// // import { ShowToast } from '../../../utils/api_content';
// // import { subscribeUser } from '../../../GlobalFunctions/main';
// // import { UpdateProfile } from '../../../redux/Slices';

// // import {
// //   initConnection,
// //   endConnection,
// //   getSubscriptions,
// //   requestSubscription,
// //   purchaseUpdatedListener,
// //   purchaseErrorListener,
// //   finishTransaction,
// // } from 'react-native-iap';

// // const SUBSCRIPTION_IDS = [
// //   'sub_individual_weekly_basic',
// //   'sub_individual_weekly_premium',
// //   'sub_individual_monthly_premium',
// //   'sub_couples_weekly_premium',
// //   'sub_couples_monthly_premium',
// // ];

// // // Ab hum static pricing aur names yahan se hata rahe hain. Only UI-specific features & badges content yahan rahega.
// // const PLAN_UI_ASSETS = {
// //   sub_individual_weekly_basic: {
// //     period: 'week',
// //     type: 'individual',
// //     popular: false,
// //     badge: 'Essential',
// //     defaultName: 'Weekly Basic',
// //     defaultPrice: '$0.69',
// //     features: [
// //       'Share lists with up to 2 friends',
// //       'Standard custom list builder',
// //       'Access nearby dining recommendations',
// //       'Standard customer support',
// //     ],
// //   },
// //   sub_individual_weekly_premium: {
// //     period: 'week',
// //     type: 'individual',
// //     popular: false,
// //     badge: 'Premium',
// //     defaultName: 'Weekly Premium',
// //     defaultPrice: '$0.99',
// //     features: [
// //       'Share lists with unlimited friends',
// //       'No ads / ad-free experience',
// //       'Create custom notes on reviews',
// //       'Unlock premium user status badge',
// //       'Priority recommended updates',
// //     ],
// //   },
// //   sub_individual_monthly_premium: {
// //     period: 'month',
// //     type: 'individual',
// //     popular: true,
// //     badge: 'Best Value',
// //     defaultName: 'Monthly Premium',
// //     defaultPrice: '$3.96',
// //     features: [
// //       'All Weekly Premium features included',
// //       'Save 30% compared to weekly plans',
// //       'Ad-free premium mapping service',
// //       'Unlimited list sharing & access',
// //       'Priority customer assistance',
// //     ],
// //   },
// //   sub_couples_weekly_premium: {
// //     period: 'week',
// //     type: 'couples',
// //     popular: false,
// //     badge: 'Couples',
// //     defaultName: 'Couples Weekly Premium',
// //     defaultPrice: '$1.89',
// //     features: [
// //       'Link 2 accounts under one billing plan',
// //       'Co-plan and share dining lists seamlessly',
// //       'No ads for both connected profiles',
// //       'Premium couples badge on profiles',
// //       'Custom notes & maps for two users',
// //     ],
// //   },
// //   sub_couples_monthly_premium: {
// //     period: 'month',
// //     type: 'couples',
// //     popular: true,
// //     defaultName: 'Couples Monthly Premium',
// //     defaultPrice: '$6.99',
// //     badge: 'Best Value',
// //     features: [
// //       'Link 2 accounts under one billing plan',
// //       'All Couples Premium features included',
// //       'Save 30% compared to weekly couples',
// //       'Unlimited sharing & map co-planning',
// //       'Dedicated couples support channel',
// //     ],
// //   },
// // };

// // const Subscriptions = ({ navigation }) => {
// //   const dispatch = useDispatch();
// //   const token = useSelector(state => state.user.token);
// //   const userData = useSelector(state => state.user.userData);

// //   const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'couples'
// //   const [subscriptionData, setSubscriptionData] = useState([]);
// //   const [loadingProducts, setLoadingProducts] = useState(true);
// //   const [purchasing, setPurchasing] = useState(false);

// //   // Active plan ID from profile/server
// //   const activePlanId = userData?.subscription?.plan;

// //   useEffect(() => {
// //     let purchaseUpdateSubscription;
// //     let purchaseErrorSubscription;

// //     const setupIAP = async () => {
// //       try {
// //         setLoadingProducts(true);
// //         const connected = await initConnection();
// //         console.log('IAP connection status:', connected);

// //         // Fetch subscriptions live from stores
// //         const products = await getSubscriptions({ skus: SUBSCRIPTION_IDS });
// //         console.log('Fetched subscriptions from native stores:', products);
// //         if (products && products.length > 0) {
// //           setSubscriptionData(products);
// //         }
// //       } catch (err) {
// //         console.warn('IAP Initialization or fetch failed:', err);
// //       } finally {
// //         setLoadingProducts(false);
// //       }
// //     };

// //     setupIAP();

// //     purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
// //       const receipt = purchase.transactionReceipt;
// //       if (receipt) {
// //         try {
// //           setPurchasing(true);
// //           const planId = purchase.productId;

// //           const res = await subscribeUser(
// //             token,
// //             planId,
// //             Platform.OS === 'android' ? purchase.purchaseToken : receipt,
// //             purchase.transactionId
// //           );

// //           if (res?.success) {
// //             ShowToast('success', 'Subscription activated successfully!');
// //             dispatch(UpdateProfile(res?.data));
// //           } else {
// //             const updatedUserData = {
// //               ...userData,
// //               subscription: {
// //                 plan: planId,
// //                 status: 'active',
// //                 transactionId: purchase.transactionId,
// //               },
// //             };
// //             dispatch(UpdateProfile(updatedUserData));
// //             ShowToast('success', 'Subscription activated (Sandbox Mode)!');
// //           }

// //           await finishTransaction({ purchase, isConsumable: false });
// //         } catch (error) {
// //           console.error('Error finishing IAP transaction:', error);
// //           ShowToast('error', 'Failed to complete subscription transaction.');
// //         } finally {
// //           setPurchasing(false);
// //         }
// //       }
// //     });

// //     purchaseErrorSubscription = purchaseErrorListener((error) => {
// //       if (error?.code !== 'E_USER_CANCELLED') {
// //         ShowToast('error', error?.message || 'An error occurred during payment.');
// //       }
// //       setPurchasing(false);
// //     });

// //     return () => {
// //       if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
// //       if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
// //       try {
// //         endConnection();
// //       } catch (e) {
// //         console.log('Error ending connection:', e);
// //       }
// //     };
// //   }, [token, userData, dispatch]);

// //   const handleSubscribePress = async (productId) => {
// //     if (purchasing) return;
// //     setPurchasing(true);

// //     const subProduct = subscriptionData.find(p => p.productId === productId);

// //     if (subProduct) {
// //       try {
// //         if (Platform.OS === 'android') {
// //           const offerToken = subProduct.subscriptionOfferDetails?.[0]?.offerToken;
// //           if (offerToken) {
// //             await requestSubscription({
// //               subscriptionOffers: [{ sku: productId, offerToken }],
// //             });
// //           } else {
// //             await requestSubscription({ sku: productId });
// //           }
// //         } else {
// //           await requestSubscription({ sku: productId });
// //         }
// //       } catch (err) {
// //         promptMockSimulation(productId);
// //       } finally {
// //         setPurchasing(false);
// //       }
// //     } else {
// //       promptMockSimulation(productId);
// //     }
// //   };

// //   const promptMockSimulation = (productId) => {
// //     const dynamicPlan = getDynamicPlanObject(productId);
// //     Alert.alert(
// //       'Subscription Sandbox',
// //       `Simulate a successful purchase for "${dynamicPlan.name}"?`,
// //       [
// //         { text: 'Cancel', onPress: () => setPurchasing(false), style: 'cancel' },
// //         { text: 'Confirm Purchase', onPress: () => executeMockPurchase(productId) },
// //       ],
// //       { cancelable: true }
// //     );
// //   };

// //   const executeMockPurchase = async (productId) => {
// //     try {
// //       const res = await subscribeUser(token, productId, 'mock_' + Date.now(), 'mock_' + Date.now());
// //       if (res?.success) {
// //         ShowToast('success', 'Subscription activated successfully!');
// //         dispatch(UpdateProfile(res?.data));
// //       } else {
// //         const updatedUserData = { ...userData, subscription: { plan: productId, status: 'active' } };
// //         dispatch(UpdateProfile(updatedUserData));
// //         ShowToast('success', 'Subscription activated (Local Sandbox)!');
// //       }
// //     } catch (err) {
// //       ShowToast('error', 'Mock purchase execution error.');
// //     } finally {
// //       setPurchasing(false);
// //     }
// //   };

// //   // 🛠️ MAGIC ENGINE: Yeh function local array aur native store ke values ko completely combine (Merge) karke dynamic details data create karta hai
// //   const getDynamicPlanObject = (productId) => {
// //     const uiAsset = PLAN_UI_ASSETS[productId];
// //     const storeProduct = subscriptionData.find(p => p.productId === productId);

// //     let dynamicPrice = uiAsset.defaultPrice;
// //     let dynamicName = uiAsset.defaultName;
// //     let dynamicDescription = uiAsset.features;

// //     if (storeProduct) {
// //       // 1. Dynamic Name Extraction
// //       // Google Play localizedTitle mein aksar (App Name) shamil hota hai, usay clean karne ke liye splits use karte hain
// //       dynamicName = storeProduct.title ? storeProduct.title.split(' (')[0] : uiAsset.defaultName;

// //       // 2. Dynamic Price Extraction
// //       if (Platform.OS === 'android') {
// //         const offerDetails = storeProduct.subscriptionOfferDetails?.[0];
// //         const pricePhase = offerDetails?.pricingPhases?.pricingPhaseList?.[0];
// //         if (pricePhase?.formattedPrice) {
// //           dynamicPrice = pricePhase.formattedPrice;
// //         }
// //       } else {
// //         dynamicPrice = storeProduct.localizedPrice || storeProduct.price || uiAsset.defaultPrice;
// //       }

// //       // 3. Dynamic Features/Description Extraction
// //       // Agar play store descriptor load ho jaye aur usme comma-separated lines hon to array bana dein
// //       if (storeProduct.description) {
// //         const parsedDesc = storeProduct.description.split(/[.,;\n]+/);
// //         if (parsedDesc.length > 1) {
// //           dynamicDescription = parsedDesc.map(str => str.trim()).filter(str => str.length > 0);
// //         }
// //       }
// //     }

// //     return {
// //       id: productId,
// //       name: dynamicName,
// //       price: dynamicPrice,
// //       period: uiAsset.period,
// //       type: uiAsset.type,
// //       popular: uiAsset.popular,
// //       badge: uiAsset.badge,
// //       features: dynamicDescription,
// //     };
// //   };

// //   // Filter and build fully dynamic plans list matching category tab
// //   const computedDynamicPlans = SUBSCRIPTION_IDS.map(id => getDynamicPlanObject(id)).filter(
// //     plan => plan.type === activeTab
// //   );

// //   return (
// //     <ScreenWrapper>
// //       <View style={styles.headerWrapper}>
// //         <AppHeader onBackPress={true} heading="Subscriptions" />
// //       </View>

// //       <ScrollView
// //         style={styles.container}
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.scrollContent}>

// //         {/* Top Hero Banner */}
// //         <View style={styles.heroContainer}>
// //           <View style={styles.badgeContainer}>
// //             <Ionicons name="trophy" size={24} color={AppColors.Yellow} />
// //             <AppText title="W.I.G. OUT PREMIUM" textColor={AppColors.Yellow} textSize={1.5} textFontWeight />
// //           </View>
// //           <LineBreak space={1} />
// //           <AppText title="Unlock Ultimate Sharing & Mapping" textColor={AppColors.BLACK} textSize={2.6} textFontWeight textAlignment="center" />
// //           <LineBreak space={1} />
// //           <AppText title="Share your custom place listings, map recommendations, and notes with friends and groups without limits." textColor={AppColors.blackOpacity} textSize={1.6} textAlignment="center" />
// //         </View>

// //         <LineBreak space={1} />

// //         {/* Individual vs Couples Tab Switcher */}
// //         <View style={styles.tabContainer}>
// //           <TouchableOpacity
// //             style={[styles.tabButton, activeTab === 'individual' && styles.activeTabButton]}
// //             activeOpacity={0.8}
// //             onPress={() => setActiveTab('individual')}>
// //             <Ionicons name="person-outline" size={18} color={activeTab === 'individual' ? AppColors.WHITE : AppColors.BTNCOLOURS} />
// //             <AppText title="Individual" textColor={activeTab === 'individual' ? AppColors.WHITE : AppColors.BTNCOLOURS} textSize={1.7} textFontWeight />
// //           </TouchableOpacity>

// //           <TouchableOpacity
// //             style={[styles.tabButton, activeTab === 'couples' && styles.activeTabButton]}
// //             activeOpacity={0.8}
// //             onPress={() => setActiveTab('couples')}>
// //             <Ionicons name="people-outline" size={18} color={activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS} />
// //             <AppText title="Couples" textColor={activeTab === 'couples' ? AppColors.WHITE : AppColors.BTNCOLOURS} textSize={1.7} textFontWeight />
// //           </TouchableOpacity>
// //         </View>

// //         <LineBreak space={2} />

// //         {/* Loading Spinner */}
// //         {loadingProducts && (
// //           <View style={styles.loaderContainer}>
// //             <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
// //             <LineBreak space={1} />
// //             <AppText title="Loading Store Offers..." textColor={AppColors.blackOpacity} />
// //           </View>
// //         )}

// //         {/* Dynamic Plans List */}
// //         {!loadingProducts && (
// //           <View style={styles.plansList}>
// //             {computedDynamicPlans.map((plan) => {
// //               const isActive = activePlanId === plan.id;

// //               return (
// //                 <View
// //                   key={plan.id}
// //                   style={[
// //                     styles.planCard,
// //                     plan.popular && styles.popularCard,
// //                     isActive && styles.activeCard,
// //                   ]}>

// //                   {/* Badge */}
// //                   {plan.badge && (
// //                     <View style={[styles.cardBadge, plan.popular ? styles.popularBadge : styles.normalBadge]}>
// //                       <AppText title={plan.badge.toUpperCase()} textColor={AppColors.WHITE} textSize={1.1} textFontWeight />
// //                     </View>
// //                   )}

// //                   {/* Header Title */}
// //                   <View style={styles.cardHeader}>
// //                     <AppText title={plan.name} textColor={AppColors.BLACK} textSize={2.1} textFontWeight />
// //                     {plan.popular && <Ionicons name="star" size={20} color={AppColors.Yellow} />}
// //                   </View>

// //                   <LineBreak space={1} />

// //                   {/* Dynamic Pricing */}
// //                   <View style={styles.priceContainer}>
// //                     <AppText title={plan.price} textColor={AppColors.BTNCOLOURS} textSize={3.2} textFontWeight />
// //                     <AppText title={` / ${plan.period}`} textColor={AppColors.blackOpacity} textSize={1.6} />
// //                   </View>

// //                   <LineBreak space={1.5} />
// //                   <View style={styles.divider} />
// //                   <LineBreak space={1.5} />

// //                   {/* Features */}
// //                   <View style={styles.featuresContainer}>
// //                     {plan.features.map((feature, idx) => (
// //                       <View key={idx} style={styles.featureRow}>
// //                         <Ionicons
// //                           name="checkmark-circle"
// //                           size={18}
// //                           color={plan.popular ? AppColors.Yellow : AppColors.BTNCOLOURS}
// //                           style={styles.checkmarkIcon}
// //                         />
// //                         <View style={styles.featureTextWrapper}>
// //                           <AppText title={feature} textColor={AppColors.BLACK} textSize={1.5} />
// //                         </View>
// //                       </View>
// //                     ))}
// //                   </View>

// //                   <LineBreak space={2.5} />

// //                   {/* Subscribe/Action Button */}
// //                   <AppButton
// //                     title={isActive ? 'Current Plan' : 'Subscribe Now'}
// //                     disabled={isActive || purchasing}
// //                     loading={purchasing && !isActive}
// //                     handlePress={() => handleSubscribePress(plan.id)}
// //                     btnBackgroundColor={isActive ? '#E0E0E0' : plan.popular ? AppColors.Yellow : AppColors.BTNCOLOURS}
// //                     textColor={isActive ? AppColors.blackOpacity : AppColors.WHITE}
// //                     btnPadding={16}
// //                   />
// //                 </View>
// //               );
// //             })}
// //           </View>
// //         )}

// //         <LineBreak space={3} />

// //         {/* Footer info details */}
// //         <View style={styles.footerNote}>
// //           <AppText title="Subscription Terms & Auto-Renewal Details:" textColor={AppColors.blackOpacity} textSize={1.3} textFontWeight />
// //           <LineBreak space={0.5} />
// //           <AppText
// //             title="Subscriptions will automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period. Your account will be charged for renewal within 24-hours prior to the end of the current period. Manage or cancel your subscriptions in your mobile App Store or Google Play Store settings."
// //             textColor={AppColors.blackOpacity}
// //             textSize={1.2}
// //             textAlignment="justify"
// //           />
// //         </View>

// //         <LineBreak space={4} />
// //       </ScrollView>
// //     </ScreenWrapper>
// //   );
// // };

// // // Styles remain unchanged for design safety
// // const styles = StyleSheet.create({
// //   headerWrapper: { paddingBottom: 5 },
// //   container: { flex: 1 },
// //   scrollContent: { paddingBottom: responsiveHeight(5), paddingHorizontal: responsiveWidth(5) },
// //   heroContainer: { alignItems: 'center', paddingVertical: 15 },
// //   badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.WHITE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, gap: 8 },
// //   tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: 30, padding: 4, borderWidth: 1, borderColor: 'rgba(71, 8, 46, 0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
// //   tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 26, gap: 8 },
// //   activeTabButton: { backgroundColor: AppColors.BTNCOLOURS },
// //   loaderContainer: { alignItems: 'center', paddingVertical: 40 },
// //   plansList: { gap: 20 },
// //   planCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#EFEFEF', position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
// //   popularCard: { borderColor: AppColors.Yellow, borderWidth: 2, shadowOpacity: 0.12, shadowRadius: 14 },
// //   activeCard: { borderColor: AppColors.BTNCOLOURS, borderWidth: 1.5, backgroundColor: '#FAF7FA' },
// //   cardBadge: { position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
// //   normalBadge: { backgroundColor: AppColors.BTNCOLOURS },
// //   popularBadge: { backgroundColor: AppColors.Yellow },
// //   cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContext: 'space-between', paddingRight: 60 },
// //   priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
// //   divider: { height: 1, backgroundColor: '#F0F0F0' },
// //   featuresContainer: { gap: 12 },
// //   featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
// //   footerNote: { paddingHorizontal: 10, opacity: 0.75 },
// //   checkmarkIcon: { marginRight: 10, marginTop: 2 },
// //   featureTextWrapper: { flex: 1 },
// // });

// // export default Subscriptions;
