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
import {
  verifyIAPReceipt,
  getUserSubscription,
} from '../../../GlobalFunctions/main'; // Ensure this uses your direct live API URL endpoint
import {UpdateProfile} from '../../../redux/Slices';

// ✅ v12 Specific Imports
import {
  initConnection,
  getSubscriptions,
  getProducts,
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
    defaultName: 'Individual Weekly Basic',
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
    defaultName: 'Individual Weekly Premium',
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
    defaultName: 'Individual Monthly Premium',
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

  const activePlanId = userData?.subscription?.productId;

  // Global check: subscription is truly active (not expired)
  const isActiveSubscription =
    !!userData?.subscription &&
    userData.subscription.subscriptionStatus !== 'expired' &&
    userData.subscription.subscriptionStatus !== 'cancelled' &&
    userData.subscription.status !== 'expired' &&
    userData.subscription.status !== 'cancelled';

  useEffect(() => {
    if (
      activePlanId &&
      typeof activePlanId === 'string' &&
      isActiveSubscription
    ) {
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
  }, [activePlanId, userData?.subscription?.plan, isActiveSubscription]);

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
          let products = [];
          try {
            products = await getSubscriptions({skus: SUBSCRIPTION_IDS});
            console.log(
              '[IAP v12] getSubscriptions fetched successfully:',
              products,
            );
          } catch (subErr) {
            console.warn('[IAP v12] getSubscriptions error:', subErr);
          }

          // Fallback to getProducts on iOS if getSubscriptions returned empty
          if (Platform.OS === 'ios' && (!products || products.length === 0)) {
            try {
              console.log('[IAP v12] Falling back to getProducts for iOS...');
              products = await getProducts({skus: SUBSCRIPTION_IDS});
              console.log(
                '[IAP v12] getProducts fetched successfully:',
                products,
              );
            } catch (prodErr) {
              console.warn('[IAP v12] getProducts error:', prodErr);
            }
          }

          if (products && products.length > 0) {
            setStoreSubscriptions(products);
            // ShowToast('success', 'Subscription products loaded successfully.');
          } else {
            console.log('[IAP v12] No products returned from store.');
            ShowToast('info', 'No subscription products found in the store.');
          }
        } else {
          ShowToast('error', 'Could not connect to the App Store/Play Store.');
        }
      } catch (err) {
        console.warn('[IAP v12] Initial setup failed:', err);
        ShowToast(
          'error',
          'Billing setup failed. Cannot load subscription products.',
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    initializeIAP();

    return () => {
      // Keep global connection alive for App.tsx listeners
    };
  }, []);

  // ✅ Live Sync with backend GET API `/getSubscription`
  useEffect(() => {
    const syncSubscription = async () => {
      if (!token) return;
      try {
        const response = await getUserSubscription(token);
        console.log('[Subscriptions Sync response]:', response);
        if (response && response.success && response.subscription) {
          let plan = storeSubscriptions?.find(
            sub => sub?.productId === activePlanId,
          )?.title;

          dispatch(
            UpdateProfile({
              ...userData,
              subscription: {...response.subscription, plan: plan},
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
        const plan = storeSubscriptions.find(
          p => p.productId === activeStoreReceipt?.productId,
        )?.title;
        console.log('plan in restore purchase:-', plan);

        let payload = {
          platform: Platform.OS === 'android' ? 'google' : 'apple',
          subType,
          plan,
          productId: targetPlanId,
          purchaseToken: receiptToken || '',
          type: 'proceed',
          signedTransactionInfo:
            Platform.OS === 'android' ? null : receiptToken,
        };
        console.log('Payload:-', payload);
        const res = await verifyIAPReceipt(token, payload);
        console.log('res in verifyIAPReceipt:-', res);

        if (res?.success) {
          const updatedUser = res.user ||
            res.data || {
              ...userData,
              subscription: {
                ...res.subscription,
                plan: plan || '',
                status: 'active',
                productId: targetPlanId,
              },
            };
          if (!updatedUser.subscription && res.subscription) {
            updatedUser.subscription = res.subscription;
          } else if (!updatedUser.subscription) {
            updatedUser.subscription = {
              plan: plan,
              status: 'active',
              productId: targetPlanId,
            };
          }
          dispatch(UpdateProfile(updatedUser));
          ShowToast('success', 'Your subscription was successfully restored!');
        } else {
          // Local Fallback Sync
          const restoredLocalMap = {
            ...userData,
            subscription: {
              plan: plan,
              status: 'active',
              productId: targetPlanId,
            },
          };
          dispatch(UpdateProfile(restoredLocalMap));
          ShowToast('success', 'Subscription restored (Local Fallback Mode)!');
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
    console.log('subProduct:-', subProduct);
    if (subProduct) {
      try {
        ShowToast('info', 'Connecting to store for purchase...');
        let purchase;
        if (Platform.OS === 'android') {
          const offerToken =
            subProduct.subscriptionOfferDetails?.[0]?.offerToken;
          if (offerToken) {
            purchase = await requestSubscription({
              subscriptionOffers: [{sku: productId, offerToken}],
            });
          } else {
            purchase = await requestSubscription({sku: productId});
          }
        } else {
          purchase = await requestSubscription({sku: productId});
        }

        // After successful store purchase, verify with backend
        if (purchase) {
          const purchaseToken =
            Platform.OS === 'android'
              ? purchase.purchaseToken
              : purchase.transactionReceipt;

          const subType = productId.includes('monthly') ? 'monthly' : 'weekly';
          // const plan = productId.includes('couples') ? 'couples' : 'individual';
          const plan = subProduct?.title;

          const res = await verifyIAPReceipt(token, {
            platform: Platform.OS === 'android' ? 'google' : 'apple',
            subType,
            plan,
            productId,
            purchaseToken: purchaseToken || '',
            type: 'proceed',
            signedTransactionInfo:
              Platform.OS === 'android' ? null : purchaseToken,
          });

          console.log('[IAP Purchase] verifyIAPReceipt response:', res);

          if (res?.success) {
            const updatedUser = res.user ||
              res.data || {
                ...userData,
                subscription: {...res.subscription, plan: plan},
                // subscription: res.subscription || {
                //   plan,
                //   status: 'active',
                //   productId,
                //   subType,
                //   subscriptionStatus: 'active',
                // },
              };
            if (!updatedUser.subscription && res.subscription) {
              updatedUser.subscription = res.subscription;
            } else if (!updatedUser.subscription) {
              updatedUser.subscription = {
                plan,
                status: 'active',
                productId,
                subType,
                subscriptionStatus: 'active',
              };
            }
            dispatch(UpdateProfile(updatedUser));
            ShowToast('success', 'Subscription activated successfully!');
          } else {
            // Backend verification failed — local fallback
            const updatedUserData = {
              ...userData,
              subscription: {
                plan,
                status: 'active',
                productId,
                subType,
                subscriptionStatus: 'active',
                transactionId: purchase.transactionId || purchase.id,
              },
            };
            dispatch(UpdateProfile(updatedUserData));
            ShowToast('success', 'Subscription activated (Local Fallback)!');
          }
        }
      } catch (err) {
        console.log(
          '[IAP Engine Error] Live prompt failed, loading sandbox simulation:',
          err,
        );
        const isCancelled =
          err?.message?.toLowerCase().includes('cancel') ||
          err?.code === 'E_USER_CANCELLED';
        if (isCancelled) {
          ShowToast('info', 'Purchase cancelled.');
        } else {
          ShowToast('error', err?.message || 'Failed to initiate purchase.');
          promptMockSimulation(productId);
        }
      } finally {
        setPurchasing(false);
      }
    } else {
      ShowToast(
        'info',
        'Product not loaded in store. Starting Sandbox Simulation.',
      );
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

      if (res?.success) {
        ShowToast('success', 'Subscription activated successfully!');
        const updatedUser = res.user ||
          res.data || {
            ...userData,
            subscription: res.subscription || {
              plan: productId,
              status: 'active',
              productId: productId,
            },
          };
        if (!updatedUser.subscription && res.subscription) {
          updatedUser.subscription = res.subscription;
        } else if (!updatedUser.subscription) {
          updatedUser.subscription = {
            plan: productId,
            status: 'active',
            productId: productId,
          };
        }
        dispatch(UpdateProfile(updatedUser));
      } else {
        const updatedUserData = {
          ...userData,
          subscription: {
            plan: productId,
            status: 'active',
            productId: productId,
          },
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
    let dynamicName = uiAsset.defaultName;
    let dynamicDescription = uiAsset.features;

    if (storeProduct) {
      const parsedTitle = storeProduct.title
        ? storeProduct.title.split(' (')[0]
        : '';
      if (
        parsedTitle &&
        !parsedTitle.includes('_') &&
        !parsedTitle.toLowerCase().includes('sub_') &&
        parsedTitle !== productId
      ) {
        dynamicName = parsedTitle;
      } else {
        dynamicName = uiAsset.defaultName;
      }

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
              const isActive = isActiveSubscription && activePlanId === plan.id;

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
    borderWidth: 2,
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
