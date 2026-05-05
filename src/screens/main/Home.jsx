import React, {useState, useEffect, useRef, Fragment} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppColors from '../../utils/AppColors';
import LineBreak from '../../components/LineBreak';
import AppText from '../../components/AppTextComps/AppText';
import {AppIcons} from '../../assets/icons';
import SVGXml from '../../components/SVGXML';
import {useCustomNavigation, useDebounce} from '../../utils/Hooks';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import {useUserPreferences} from '../../utils/UserPreferences';

import {baseUrl} from '../../utils/api_content';
import HomeCard from '../../components/HomeCard';
import ScreenWrapper from '../../components/ScreenWrapper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FetchNearbyPlaces from '../../ApiCalls/Main/FetchNearbyPlaces';
import {GetReviews} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../../ApiCalls/Main/WishList_API/WishListAPI';
import {setRecommendedPlaces} from '../../redux/Slices';
import {useIsFocused} from '@react-navigation/native';
// import {requestLocationPermission} from '../../utils/Permissions';
// import {startBackgroundService} from '../../services/BackgroundLocationService';

const CATEGORIES = [
  {id: '1', name: 'Restaurants', type: 'restaurant', icon: 'restaurant'},
  {
    id: '2',
    name: 'RV Parks & Recreation',
    type: 'rv_park',
    icon: 'rv-truck',
    library: 'MaterialCommunityIcons',
  },
  {id: '3', name: 'Gas', type: 'gas_station', icon: 'local-gas-station'},
  {id: '4', name: 'Hotels', type: 'lodging', icon: 'hotel'},
  {
    id: '5',
    name: 'To do Near Me',
    type: '',
    keyword: 'zoo museum science center art show',
    icon: 'map-marker-radius',
    library: 'MaterialCommunityIcons',
  },
  {id: '6', name: 'Cafes', type: 'cafe', icon: 'local-cafe'},
];

const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  address: 'San Francisco, CA',
};

const Home = () => {
  const dispatch = useDispatch();
  const {navigateToRoute, navigation} = useCustomNavigation();
  const userData = useSelector(state => state.user.userData);
  const fetchedLocations = useSelector(
    state => state?.user?.places_nearby || [],
  );
  const placesRecommended = useSelector(
    state => state?.user?.places_recommended || [],
  );
  const currentLocation = useSelector(state => state.user.current_location);
  const token = useSelector(state => state.user.token);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState('');
  const [likedItems, setLikedItems] = useState([]);
  const [avoidItems, setAvoidItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  const debouncedSearch = useDebounce(search, 500);

  // Animation values (preserved from your original code)
  const headerAnim = useRef(new Animated.Value(0)).current;
  const recommendedAnim = useRef(new Animated.Value(0)).current;
  const nearbyAnim = useRef(new Animated.Value(0)).current;
  const isFocussed = useIsFocused();

  // Flow control states
  const [includeShowBranding, setIncludeShowBranding] = useState(true);

  const {recommendedLocations} = useUserPreferences(
    likedItems,
    wishlistItems,
    placesRecommended,
  );

  // Fetch logic for category/location updates
  useEffect(() => {
    fetchData();
  }, [currentLocation, selectedCategory]);

  // Fetch logic for recommendations (location only, independent of category)
  // DEPRECATED: Combined into focus listener to ensure data synchronization
  // useEffect(() => {
  //   fetchRecommendedData();
  // }, [currentLocation, isFocussed]);

  const getDisplayCategory = item => {
    const types = item?.types || [];
    const filterTypes = [
      'point_of_interest',
      'establishment',
      'food',
      'restaurant',
      'health',
      'store',
      'natural_feature',
    ];

    const meaningfulType =
      types.find(t => !filterTypes.includes(t)) || types[0];
    if (!meaningfulType) return 'Place';

    return meaningfulType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchRecommendedData = async (
    currentLiked = [],
    currentWishlist = [],
  ) => {
    const loc =
      currentLocation?.latitude && currentLocation?.longitude
        ? currentLocation
        : DEFAULT_LOCATION;

    try {
      // 1. Broad fetch for general recommendations
      const broadResults = await FetchNearbyPlaces(
        loc,
        dispatch,
        'all',
        '',
        'skip',
      );

      // 2. Targeted fetch for user's specific interests
      let targetedResults = [];

      // Extract interests from both categories and Google types
      const rawInterests = [...currentLiked, ...currentWishlist].flatMap(
        item => {
          const cats = [];
          if (item.category) cats.push(item.category.toLowerCase());
          if (item.types && Array.isArray(item.types)) {
            cats.push(...item.types.map(t => t.toLowerCase()));
          }
          return cats;
        },
      );

      // Filter out generic tags
      const filterTypes = [
        'point_of_interest',
        'establishment',
        'food',
        'restaurant',
        'health',
        'store',
        'natural_feature',
      ];

      // 1. Filter out generic tags and unusable empty strings
      const filteredRaw = rawInterests.filter(
        cat => cat && !filterTypes.includes(cat),
      );

      // 2. Count frequencies
      const frequencyMap = {};
      filteredRaw.forEach(cat => {
        const normalized = cat.trim().toLowerCase().replace(/\s+/g, '_');
        frequencyMap[normalized] = (frequencyMap[normalized] || 0) + 1;
      });

      // 3. Sort unique interests by frequency (descending)
      const sortedInterests = Object.keys(frequencyMap).sort(
        (a, b) => frequencyMap[b] - frequencyMap[a],
      );

      // Top 5 niche interests
      const topInterests = sortedInterests.slice(0, 5);

      console.log('Engine Debug: Top niche interests (frequency-based):', {
        counts: frequencyMap,
        selected: topInterests,
      });

      if (topInterests.length > 0) {
        const targetedFetches = topInterests.map(interest => {
          // Robust fetch: use as type, and use original as keyword
          const keyword = interest.replace(/_/g, ' ');
          return FetchNearbyPlaces(loc, dispatch, interest, keyword, 'skip');
        });
        const resultsArray = await Promise.all(targetedFetches);
        targetedResults = resultsArray.flat();
        console.log(
          `Engine Debug: Targeted fetch (Top ${topInterests.length}) returned ${targetedResults.length} items`,
        );
      }

      // 3. Merge and deduplicate
      const combined = [...broadResults, ...targetedResults];
      console.log(
        `Engine Debug: Combined ${broadResults.length} broad and ${targetedResults.length} targeted results.`,
      );

      const uniqueMap = new Map();
      combined.forEach(item => {
        const id = item.place_id || item.placeId || item?._id;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, item);
        }
      });

      const finalSet = Array.from(uniqueMap.values());
      console.log(
        `Engine Debug: Dispatching ${finalSet.length} unique recommended places.`,
      );
      dispatch(setRecommendedPlaces(finalSet));
    } catch (error) {
      console.log('Error fetching recommended data:', error);
    }
  };

  const fetchData = async (showLoader = true) => {
    const loc =
      currentLocation?.latitude && currentLocation?.longitude
        ? currentLocation
        : DEFAULT_LOCATION;

    if (showLoader) setIsLoading(true);
    await FetchNearbyPlaces(
      loc,
      dispatch,
      selectedCategory.type,
      selectedCategory.keyword || '',
    );
    if (showLoader) setIsLoading(false);

    // Re-trigger entrance animations if data arrives later
    Animated.stagger(150, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(recommendedAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(nearbyAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (token) {
      try {
        const [revRes, wishRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);
        let freshLiked = [];
        let freshWishlist = [];
        if (revRes?.reviews) {
          freshLiked = revRes.reviews.filter(r => r.actionType === 'Go Again');
          setLikedItems(freshLiked);
          setAvoidItems(revRes.reviews.filter(r => r.actionType === 'Avoid'));
        }
        const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
        if (wishlistData && Array.isArray(wishlistData)) {
          freshWishlist = wishlistData;
          setWishlistItems(freshWishlist);
        }
        await fetchRecommendedData(freshLiked, freshWishlist);
      } catch (error) {
        console.log('Error refreshing data:', error);
      }
    }
    await fetchData(false); // Refresh nearby places without full screen loader
    setRefreshing(false);
  };

  useEffect(() => {
    const refreshAllData = async () => {
      if (!token) return;
      try {
        // 1. Fetch latest user history
        console.log(
          'Home focused: Refreshing user history and recommendations...',
        );
        const [revRes, wishRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);

        let freshLiked = [];
        let freshWishlist = [];

        if (revRes?.reviews) {
          freshLiked = revRes.reviews.filter(r => r.actionType === 'Go Again');
          setLikedItems(freshLiked);
          setAvoidItems(revRes.reviews.filter(r => r.actionType === 'Avoid'));
        }

        const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
        if (wishlistData && Array.isArray(wishlistData)) {
          freshWishlist = wishlistData;
          setWishlistItems(freshWishlist);
        }

        // 2. Trigger recommendations with FRESH data immediately
        fetchRecommendedData(freshLiked, freshWishlist);
      } catch (error) {
        console.log('Error refreshing data on Home focus:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', refreshAllData);
    refreshAllData(); // Initial refresh
    return unsubscribe;
  }, [navigation, token, currentLocation]);

  // Handle Background Location Service initialization
  // useEffect(() => {
  //   const initBackgroundService = async () => {
  //     if (!token) return;

  //     const hasPermission = await requestLocationPermission();
  //     if (hasPermission) {
  //       console.log('Permission granted, starting background service...');
  //       await startBackgroundService();
  //     } else {
  //       console.log('Background location permission denied.');
  //     }
  //   };

  //   initBackgroundService();
  // }, [token]);

  useEffect(() => {
    // Start initial animations staggered
    Animated.stagger(150, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 2) {
      handleSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearch = async query => {
    const loc =
      currentLocation?.latitude && currentLocation?.longitude
        ? currentLocation
        : DEFAULT_LOCATION;

    setIsLoading(true);
    // Passing empty string for 'type' so it searches all categories using the keyword
    await FetchNearbyPlaces(loc, dispatch, '', query);
    setIsLoading(false);
  };

  const renderHeader = () => (
    <View>
      <LineBreak space={3} />
      {/* Profile and Greeting Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => navigateToRoute('Profile')}
            activeOpacity={0.8}>
            <FastImage
              source={{
                uri: `${baseUrl}/${userData?.profileImage}`,
                priority: FastImage.priority.normal,
              }}
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

        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => navigateToRoute('WishList')}
            style={styles.notificationBtn}>
            <FontAwesome
              name="bookmark"
              size={18}
              color={AppColors.BTNCOLOURS}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateToRoute('Notifications')}
            style={styles.notificationBtn}>
            <SVGXml width="22" height="22" icon={AppIcons.notification_black} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          onPress={() => navigateToRoute('MyLikes')}
          style={styles.statChip}>
          <Ionicons name="heart" size={16} color="#4CAF50" />
          <AppText
            title={`${likedItems.length} Go Again`}
            textSize={1.3}
            textColor="#4CAF50"
            textFontWeight
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToRoute('MyHates')}
          style={styles.statChip}>
          <Ionicons name="thumbs-down" size={16} color="#D32F2F" />
          <AppText
            title={`${avoidItems.length} Avoid`}
            textSize={1.3}
            textColor="#D32F2F"
            textFontWeight
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToRoute('WishList')}
          style={styles.statChip}>
          <FontAwesome name="bookmark" size={16} color="#FF9800" />
          <AppText
            title={`${wishlistItems.length} Wish List`}
            textSize={1.3}
            textColor="#FF9800"
            textFontWeight
          />
        </TouchableOpacity>
      </View>

      <LineBreak space={2} />

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarPill}>
          <Ionicons name="search-outline" size={20} color="#47082E" />
          <TextInput
            placeholder="Search here."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={search}
            onChangeText={text => setSearch(text)}
            onSubmitEditing={() => handleSearch(search)}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                handleSearch('');
                setSearch('');
              }}>
              <Ionicons name="close-circle-outline" size={20} color="#47082E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs Section */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}>
          {CATEGORIES.map(category => {
            const isActive = selectedCategory.id === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}>
                <View style={styles.tabContent}>
                  {category.library === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={responsiveFontSize(2)}
                      color={isActive ? AppColors.WHITE : AppColors.GRAY}
                      style={{marginRight: 6}}
                    />
                  ) : (
                    <MaterialIcons
                      name={category.icon}
                      size={responsiveFontSize(2)}
                      color={isActive ? AppColors.WHITE : AppColors.GRAY}
                      style={{marginRight: 6}}
                    />
                  )}
                  <AppText
                    title={category.name}
                    textColor={isActive ? AppColors.WHITE : AppColors.GRAY}
                    textSize={1.5}
                    textFontWeight={isActive}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <LineBreak space={1} />

      {/* Recommended Horizontal Section */}
      {includeShowBranding && (
        <Fragment>
          <View style={{paddingHorizontal: responsiveWidth(5)}}>
            <View style={styles.sectionHeader}>
              <AppText
                title="Recommended"
                textColor={AppColors.BLACK}
                textSize={2}
                textFontWeight
              />
              <View />
            </View>
          </View>

          <LineBreak space={2} />

          <Animated.View
            style={{
              paddingHorizontal: responsiveWidth(5),
              opacity: recommendedAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 1], // Always keep 10% visible to avoid blank gap if stuck
              }),
              transform: [
                {
                  translateY: recommendedAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            <FlatList
              data={recommendedLocations}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => `rec-${index}`}
              ListEmptyComponent={
                <AppText
                  title={`No recommended ${selectedCategory.name.toLowerCase()} found`}
                />
              }
              contentContainerStyle={{
                gap: 12,
                marginBottom: responsiveHeight(2),
              }}
              renderItem={({item}) => (
                <HomeCard
                  name={item?.name}
                  address={item?.vicinity}
                  CardImg={item?.photos?.[0]?.photo_reference}
                  category={getDisplayCategory(item)}
                  cardHeight={30}
                  cardWidth={75}
                  cardOnPress={() =>
                    navigateToRoute('HomeDetails', {placeDetails: item})
                  }
                />
              )}
            />
          </Animated.View>

          <View style={{paddingHorizontal: responsiveWidth(5)}}>
            <LineBreak space={1} />
            <AppText
              title={`Discover ${selectedCategory.name} Nearby`}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />
            <LineBreak space={2} />
          </View>
        </Fragment>
      )}
    </View>
  );

  // console.log('fetchedLocations:-', fetchedLocations);
  // console.log('recommendedLocations:-', recommendedLocations);
  console.log('placesRecommended:-', placesRecommended);
  return (
    <ScreenWrapper>
      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
        </View>
      ) : (
        <FlatList
          data={includeShowBranding ? fetchedLocations : []}
          ListHeaderComponent={renderHeader()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.BTNCOLOURS]}
              tintColor={AppColors.BTNCOLOURS}
            />
          }
          numColumns={2}
          keyExtractor={(_, index) => `nearby-${index}`}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{paddingBottom: responsiveHeight(4)}}
          ListEmptyComponent={
            includeShowBranding && fetchedLocations.length === 0 ? (
              <View style={{paddingHorizontal: responsiveWidth(5)}}>
                <AppText
                  title={`No ${selectedCategory.name.toLowerCase()} found nearby`}
                />
              </View>
            ) : null
          }
          renderItem={({item, index}) => (
            <Animated.View
              style={{
                opacity: nearbyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 1], // Always keep 10% visible
                }),
                transform: [
                  {
                    translateY: nearbyAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}>
              <HomeCard
                name={item?.name}
                address={item?.vicinity}
                category={selectedCategory.name}
                CardImg={item?.photos?.[0]?.photo_reference}
                cardOnPress={() =>
                  navigateToRoute('HomeDetails', {placeDetails: item})
                }
              />
            </Animated.View>
          )}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    gap: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1, // Allow this section to take available space
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.LIGHTGRAY,
  },
  notificationBtn: {
    borderWidth: 1,
    borderColor: AppColors.WHITE,
    // padding: responsiveWidth(2),
    height: 40,
    width: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
  },
  // Tab Bar Styles (Glassmorphism)
  tabContainer: {
    paddingVertical: responsiveHeight(1.5),
    backgroundColor: 'transparent',
    marginBottom: responsiveHeight(1),
  },
  tabScrollContent: {
    paddingHorizontal: responsiveWidth(5),
    gap: responsiveWidth(3),
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: responsiveWidth(25),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabItem: {
    backgroundColor: AppColors.BTNCOLOURS,
    borderColor: AppColors.BTNCOLOURS,
    elevation: 6,
    shadowColor: AppColors.BTNCOLOURS,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  searchBarContainer: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(1),
  },
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    height: 45,
    marginLeft: 12,
    fontSize: responsiveFontSize(1.8),
    color: '#47082E',
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 15,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
  },
});

export default Home;
