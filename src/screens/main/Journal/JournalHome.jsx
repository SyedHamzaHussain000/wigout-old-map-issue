import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';

// Components
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import LineBreak from '../../../components/LineBreak';
import AppButton from '../../../components/AppButton';
import SVGXml from '../../../components/SVGXML';
import WheelSpinner, {
  SPINNER_COLORS,
  WheelRef,
} from '../../../components/WheelSpinner';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {baseUrl} from '../../../utils/api_content';
import {useCustomNavigation} from '../../../utils/Hooks';
import {AppIcons} from '../../../assets/icons';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// API Calls
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../../../ApiCalls/Main/WishList_API/WishListAPI';
import {useIsFocused} from '@react-navigation/native';
import {requestLocationPermission} from '../../../utils/Permissions';
import {startBackgroundService, stopBackgroundService} from '../../../services/BackgroundLocationService';

const JournalHome = ({navigation}) => {
  const {navigateToRoute} = useCustomNavigation();
  const userData = useSelector(state => state.user.userData);
  const token = useSelector(state => state.user.token);

  const [likesData, setLikesData] = useState([]);
  const [hatesData, setHatesData] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [visitedItems, setVisitedItems] = useState([]);
  const [loader, setLoader] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const wheelRef = useRef(null);
  const isFocused = useIsFocused();
  const currentLocation = useSelector(state => state.user.current_location);

  const combinedItems = useMemo(() => {
    const combined = [];
    const ids = new Set();

    // Process Go Again items
    likesData.forEach(item => {
      const id = item.placeId || item.restaurantId || item._id;
      if (id && !ids.has(id)) {
        ids.add(id);
        combined.push({
          id,
          name: item.restaurantName || item.name || 'Unknown Place',
          fullData: item,
        });
      }
    });

    // Process Wishlist items
    wishlistItems.forEach(item => {
      const id = item.placeId || item.restaurantId || item._id;
      if (id && !ids.has(id)) {
        ids.add(id);
        combined.push({
          id,
          name: item.name || item.restaurantName || 'Unknown Place',
          fullData: item,
        });
      }
    });

    return combined;
  }, [likesData, wishlistItems]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSpinEnd = selectedWinner => {
    setWinner(selectedWinner);
  };

  const triggerSpin = () => {
    setWinner(null);
    setCelebrating(false);
    wheelRef.current?.spin();
  };

  // Use useCallback to prevent unnecessary function recreation
  const fetchData = useCallback(
    async (showLoader = true) => {
      if (!token) return;
      if (showLoader) setLoader(true);
      try {
        // Running both API calls in parallel for faster loading
        const [reviewsRes, wishlistRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);

        if (reviewsRes?.reviews) {
          const reviews = reviewsRes?.reviews;
          const likes = reviews.filter(res => res.actionType === 'Go Again');
          const hates = reviews.filter(res => res.actionType === 'Avoid');

          setLikesData(likes);
          setHatesData(hates);

          // Deduplicate visitedItems based on placeId or _id
          const visitedMap = new Map();
          [...likes, ...hates].forEach(item => {
            const id = item.placeId || item.restaurantId || item._id;
            if (!visitedMap.has(id)) {
              visitedMap.set(id, item);
            } else {
              // If already exists, keep the most recent one (assuming reviews are sorted by newest first, or just keeping the first encountered)
              // If they are not sorted, we should sort them first.
              // The API usually returns them in some order. Assuming first is newest.
            }
          });
          setVisitedItems(Array.from(visitedMap.values()));
        }

        if (wishlistRes?.success) {
          setWishlistItems(wishlistRes?.wishLists || []);
        }
      } catch (error) {
        console.error('Error fetching Journal data:', error);
      } finally {
        if (showLoader) setLoader(false);
      }
    },
    [token],
  );

  // Handle Background Location Service initialization
  const settings = useSelector(state => state.user.notificationSettings);

  useEffect(() => {
    const initBackgroundService = async () => {
      if (!token || !settings?.backgroundLocation) {
        await stopBackgroundService();
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        console.log('Permission granted, starting background service...');
        await startBackgroundService();
      } else {
        console.log('Background location permission denied.');
      }
    };

    initBackgroundService();
  }, [token, settings?.backgroundLocation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.BTNCOLOURS]}
              tintColor={AppColors.BTNCOLOURS}
            />
          }>
          {/* Redesigned Header to match Explore page */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() => navigateToRoute('Profile')}
                activeOpacity={0.8}>
                <Image
                  source={{uri: `${baseUrl}/${userData?.profileImage}`}}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <AppText
                  title={`${getGreeting()}, ${userData?.fullName || 'User'}`}
                  textColor={AppColors.BLACK}
                  textSize={2}
                  textFontWeight={true}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateToRoute('SetLocation')}
                  style={styles.locationContainer}>
                  <Ionicons
                    name="location"
                    size={14}
                    color={AppColors.BTNCOLOURS}
                  />
                  <View style={{flexShrink: 1}}>
                    <AppText
                      title={currentLocation?.address || 'Add Location'}
                      textColor={AppColors.GRAY}
                      textSize={1.2}
                      numberOfLines={1}
                      style={styles.locationText}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigateToRoute('Notifications')}
              style={styles.notificationBtn}>
              <SVGXml
                width="22"
                height="22"
                icon={AppIcons.notification_black}
              />
            </TouchableOpacity>
          </View>

          {/* Like/Hate Cards */}
          <View style={styles.cardsRow}>
            <TouchableOpacity
              style={[styles.card, {backgroundColor: '#E8F5E9'}]}
              onPress={() => navigateToRoute('MyLikes', {likesData})}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="heart-outline" size={24} color="#4CAF50" />
              </View>
              <AppText
                title={'Go Again'}
                textColor={AppColors.BLACK}
                textSize={1.8}
                textFontWeight
              />
              <AppText
                title={`${likesData.length} places`}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, {backgroundColor: '#FFEBEE'}]}
              onPress={() => navigateToRoute('MyHates', {hatesData})}>
              <View style={styles.cardIconContainer}>
                <Ionicons
                  name="thumbs-down-outline"
                  size={24}
                  color="#F44336"
                />
              </View>
              <AppText
                title={'Avoid'}
                textColor={AppColors.BLACK}
                textSize={1.8}
                textFontWeight
              />
              <AppText
                title={`${hatesData.length} places`}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            </TouchableOpacity>
          </View>

          {/* WishList/Visited Card  */}
          <View style={styles.cardsRow}>
            <TouchableOpacity
              style={[styles.card, {backgroundColor: '#FFEACC'}]}
              onPress={() => navigateToRoute('WishList')}>
              <View style={styles.cardIconContainer}>
                <FontAwesome
                  name={'bookmark-o'}
                  size={24}
                  color={AppColors.wishlist}
                />
              </View>
              <AppText
                title={'Wish List'}
                textColor={AppColors.BLACK}
                textSize={1.8}
                textFontWeight
              />
              <AppText
                title={`${wishlistItems.length} places`}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, {backgroundColor: '#E3F2FD'}]}
              onPress={() => navigateToRoute('Visited')}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="location-outline" size={24} color={'#2196F3'} />
              </View>
              <AppText
                title={'Visited'}
                textColor={AppColors.BLACK}
                textSize={1.8}
                textFontWeight
              />
              <AppText
                title={`${visitedItems?.length} places`}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            </TouchableOpacity>
          </View>

          <LineBreak space={2} />

          {/* Wheel Spinner */}
          {combinedItems.length > 1 && (
            <View style={styles.wheelSection}>
              <AppText
                title={"Can't decide? Spin the wheel!"}
                textColor={AppColors.BLACK}
                textSize={1.8}
                textFontWeight
                textAlignment="center"
              />
              <LineBreak space={2} />
              <View style={styles.wheelWrapper}>
                <WheelSpinner
                  ref={wheelRef}
                  data={combinedItems}
                  onSpinEnd={handleSpinEnd}
                  size={responsiveWidth(70)}
                />
              </View>
              <LineBreak space={2} />
              {winner ? (
                <View style={styles.winnerContainer}>
                  <TouchableOpacity
                    style={styles.winnerCard}
                    onPress={() => {
                      setCelebrating(true);
                      setTimeout(() => {
                        navigateToRoute('HomeDetails', {
                          placeDetails: winner.fullData,
                        });
                        setCelebrating(false);
                      }, 2000);
                    }}>
                    <AppText
                      title={`Winner: ${winner.name}`}
                      textColor={AppColors.BTNCOLOURS}
                      textSize={1.8}
                      textFontWeight
                      textAlignment={'center'}
                    />
                    <AppText
                      title="Let's Go! (Tap to celebrate)"
                      textColor={AppColors.GRAY}
                      textSize={1.2}
                    />
                  </TouchableOpacity>

                  <AppButton
                    title="Spin Again"
                    handlePress={triggerSpin}
                    btnWidth={40}
                    btnHeight={40}
                    btnBackgroundColor={AppColors.BTNCOLOURS}
                  />
                </View>
              ) : (
                <AppButton
                  title="Surprise Me"
                  handlePress={triggerSpin}
                  btnWidth={40}
                  btnHeight={40}
                  btnBackgroundColor={AppColors.BTNCOLOURS}
                />
              )}
              <LineBreak space={4} />
            </View>
          )}

          {/* Help Me Decide Button */}
          <AppButton
            title={'Help Me Decide'}
            handlePress={() => navigateToRoute('HelpMeDecide')}
            btnBackgroundColor={AppColors.BTNCOLOURS}
            btnWidth={90}
            leftIcon={
              <Ionicons
                name="color-wand-outline"
                size={20}
                color={AppColors.WHITE}
                style={{marginRight: 10}}
              />
            }
          />

          {/* Optional: Show loader while refreshing */}
          {loader && (
            <ActivityIndicator
              style={{marginTop: 20}}
              size="small"
              color={AppColors.BTNCOLOURS}
            />
          )}

          <LineBreak space={4} />
        </ScrollView>

        {/* Confetti Overlay */}
        {celebrating && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({length: 30}).map((_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </View>
        )}
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const ConfettiParticle = ({index}) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(Math.random() * 360);
  const opacity = useSharedValue(1);

  const color = SPINNER_COLORS[index % SPINNER_COLORS.length];

  useEffect(() => {
    const delay = Math.random() * 800;
    const duration = 1500 + Math.random() * 1000;

    translateY.value = withDelay(
      delay,
      withTiming(responsiveHeight(100), {duration}),
    );
    rotate.value = withDelay(delay, withTiming(rotate.value + 720, {duration}));
    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, {duration: 500}),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: translateY.value},
      {translateX: translateX.value},
      {rotate: `${rotate.value}deg`},
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedReanimated.View
      style={[
        {
          position: 'absolute',
          width: 8 + Math.random() * 6,
          height: 8 + Math.random() * 6,
          backgroundColor: color,
          borderRadius: index % 2 === 0 ? 0 : 5,
        },
        animatedStyle,
      ]}
    />
  );
};

export default JournalHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: responsiveHeight(2),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1, // Crucial to prevent horizontal expansion
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.LIGHTGRAY,
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: AppColors.WHITE, // Matching the Explore style (white border on transparent)
    backgroundColor: 'transparent',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    maxWidth: responsiveWidth(40), // Slightly reduced for perfect fit
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: responsiveHeight(2),
  },
  card: {
    width: responsiveWidth(43),
    padding: 15,
    borderRadius: 20,
    gap: 8,
  },
  wishListCard: {
    width: responsiveWidth(90),
    padding: 15,
    borderRadius: 20,
    marginTop: responsiveHeight(2),
    flexDirection: 'row', // Changed to row for a sleeker horizontal look
    alignItems: 'center',
    gap: 15,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishListCardIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: AppColors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelSection: {
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 25,
    paddingTop: 20,
    marginBottom: responsiveHeight(2),
    // padding: 20,
    // marginTop: responsiveHeight(2),
  },
  wheelWrapper: {
    padding: 10,
    backgroundColor: AppColors.WHITE,
    borderRadius: responsiveWidth(40),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  winnerCard: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    width: responsiveWidth(60),
    borderWidth: 1,
    borderColor: AppColors.BTNCOLOURS,
    justifyContent: 'center',
  },
  winnerContainer: {
    alignItems: 'center',
    gap: 10,
    // backgroundColor: 'red',
  },
});
