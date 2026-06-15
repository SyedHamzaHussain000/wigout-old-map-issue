import React, {
  useState,
  useEffect,
  useRef,
  Fragment,
  useMemo,
  useCallback,
} from 'react';
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
  Image,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppColors from '../../utils/AppColors';
import LineBreak from '../../components/LineBreak';
import AppText from '../../components/AppTextComps/AppText';
import {useCustomNavigation, useDebounce} from '../../utils/Hooks';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import {useUserPreferences} from '../../utils/UserPreferences';

import {baseUrl, ShowToast} from '../../utils/api_content';
import HomeCard from '../../components/HomeCard';
import ScreenWrapper from '../../components/ScreenWrapper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FetchNearbyPlaces from '../../ApiCalls/Main/FetchNearbyPlaces';
import {GetReviews} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../../ApiCalls/Main/WishList_API/WishListAPI';
import {setRecommendedPlaces} from '../../redux/Slices';
import {useIsFocused} from '@react-navigation/native';
import {
  startBackgroundService,
  stopBackgroundService,
} from '../../services/BackgroundLocationService';
import {
  getAllNotifications,
  getGreeting,
  getCustomCategories,
  deleteCustomCategory,
} from '../../GlobalFunctions/main';
import AppImages from '../../assets/images/AppImages';

const CATEGORIES = [
  {
    id: '1',
    name: 'Restaurants',
    icon: 'restaurant-outline',
    type: 'restaurant',
    keyword: 'restaurant eat food dining eat-out takeaway delivery',
    library: 'Ionicons',
  },
  {
    id: '2',
    name: 'Hotel',
    icon: 'office-building',
    type: 'lodging',
    keyword: 'hotel inn motel accommodation stay overnight lodging resort',
    library: 'MaterialCommunityIcons',
  },
  {
    id: '3',
    name: 'Cafes',
    icon: 'cafe-outline',
    type: 'cafe',
    keyword: 'cafe coffee shop tea lounge',
    library: 'Ionicons',
  },
  {
    id: '4',
    name: 'Campgrounds', // RV Parks & Recreation
    icon: 'rv-truck',
    type: 'rv_park',
    keyword: 'rv park',
    library: 'MaterialCommunityIcons',
  },
  {
    id: '5',
    name: 'To do Near Me',
    icon: 'map-outline',
    type: '',
    keyword: 'zoo museum science center art show attraction tourist_attraction',
    library: 'Ionicons',
  },
  {
    id: '6',
    name: 'Shopping',
    icon: 'cart-outline',
    type: '',
    keyword: 'shopping mall store clothing_store department_store',
    library: 'Ionicons',
  },
  {
    id: '7',
    name: 'Bar',
    icon: 'beer-outline',
    type: 'bar',
    keyword:
      'bar pub nightclub lounge alcoholic drinks cocktails beer wine spirits',
    library: 'Ionicons',
  },
  {
    id: '8',
    name: 'Gym',
    icon: 'fitness-outline',
    type: 'gym',
    keyword: 'gym fitness workout health exercise sports equipment training',
    library: 'Ionicons',
  },
  {
    id: '9',
    name: 'Other',
    icon: 'storefront-outline',
    type: 'establishment',
    library: 'Ionicons',
  },
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

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [customCategories, setCustomCategories] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const fetchCustomCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getCustomCategories(token);
      if (res?.success) {
        setCustomCategories(res?.customCategories || []);
      }
    } catch (error) {
      console.log('Error fetching custom categories:', error);
    }
  }, [token]);

  const customCategoryItems = useMemo(() => {
    if (!selectedCategory || !selectedCategory.isCustom) return [];
    const found = customCategories.find(c => c._id === selectedCategory.id);
    return found ? found.items || [] : [];
  }, [selectedCategory, customCategories]);

  const filterCategories = useMemo(() => {
    return customCategories.map(cat => ({
      id: cat._id,
      name: cat.title,
      icon: 'star-outline',
      library: 'Ionicons',
      isCustom: true,
    }));
  }, [customCategories]);

  const handleCategoryLongPress = category => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      const res = await deleteCustomCategory(token, categoryToDelete.id);
      if (res?.success) {
        ShowToast('success', 'Category deleted successfully!');
        setDeleteModalVisible(false);
        if (selectedCategory?.id === categoryToDelete.id) {
          setSelectedCategory(null);
        }
        setCategoryToDelete(null);
        await fetchCustomCategories();
      } else {
        ShowToast('error', res?.message || 'Failed to delete category.');
      }
    } catch (error) {
      ShowToast('error', 'An error occurred.');
    } finally {
      setIsDeletingCategory(false);
    }
  };
  const [search, setSearch] = useState('');
  const [likedItems, setLikedItems] = useState([]);
  const [avoidItems, setAvoidItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isRead, setIsRead] = useState(true);

  const debouncedSearch = useDebounce(search, 500);

  const isFirstLoad = useRef(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const recommendedAnim = useRef(new Animated.Value(0)).current;
  const nearbyAnim = useRef(new Animated.Value(0)).current;
  const isFocussed = useIsFocused();

  const [includeShowBranding] = useState(true);

  const recommendationPool = useMemo(() => {
    const combined = [...placesRecommended, ...fetchedLocations];
    const uniqueMap = new Map();
    combined.forEach(item => {
      const id = item.place_id || item.placeId || item?._id;
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [placesRecommended, fetchedLocations]);

  const {recommendedLocations} = useUserPreferences(
    likedItems,
    wishlistItems,
    avoidItems,
    recommendationPool,
  );

  const displayedRecommended = useMemo(() => {
    // 1. Agar koi filter apply nahi hai, to default recommended locations return karo
    if (!selectedCategory) {
      return recommendedLocations;
    }

    const catId = selectedCategory?.id;
    const catType = selectedCategory?.type?.toLowerCase();
    const catName = selectedCategory?.name?.toLowerCase();

    return recommendedLocations.filter(item => {
      const itemCategory = item?.category?.toLowerCase() || '';
      const itemTypes = (item?.types || []).map(t => t.toLowerCase());
      const itemName = item?.name?.toLowerCase() || '';

      // ========================================================
      // STAGE 1: ULTRA-STRICT CROSS-CATEGORY EXCLUSIONS (BLOCK LIST)
      // ========================================================

      // Agar Restaurants (ID: 1) -> Block Bar, Cafe, Lodging, Movie, Grocery
      if (catId === '1') {
        if (
          itemTypes.includes('bar') ||
          itemTypes.includes('cafe') ||
          itemTypes.includes('lodging') ||
          itemTypes.includes('grocery_or_supermarket') ||
          itemTypes.includes('movie_theater') ||
          itemCategory.includes('bar') ||
          itemCategory.includes('cafe') ||
          itemCategory.includes('lodging')
        ) {
          return false;
        }
      }

      // Agar Hotel (ID: 2) -> Block RV Park, Campground, Bar, Restaurant
      if (catId === '2') {
        if (
          itemTypes.includes('rv_park') ||
          itemTypes.includes('campground') ||
          itemTypes.includes('bar') ||
          itemCategory.includes('rv park')
        ) {
          return false;
        }
      }

      // Agar Cafes (ID: 3) -> Block Lodging (Hotels/Motels) strictly
      if (catId === '3') {
        if (itemTypes.includes('lodging') || itemCategory.includes('lodging')) {
          return false;
        }
      }

      // Agar RV Parks (ID: 4) -> Block Bar, Restaurant, Cafe (NOT lodging — many RV parks have lodging type)
      if (catId === '4') {
        if (
          itemTypes.includes('bar') ||
          itemTypes.includes('restaurant') ||
          itemTypes.includes('cafe')
        ) {
          return false;
        }
      }

      // Agar Shopping (ID: 6) -> Block Bar, Restaurant, Cafe, Lodging
      if (catId === '6') {
        if (
          itemTypes.includes('bar') ||
          itemTypes.includes('restaurant') ||
          itemTypes.includes('cafe') ||
          itemTypes.includes('lodging') ||
          itemCategory.includes('bar') ||
          itemCategory.includes('restaurant')
        ) {
          return false;
        }
      }

      // Agar Bar (ID: 7) -> Block Lodging, Store
      if (catId === '7') {
        if (
          itemTypes.includes('lodging') ||
          itemTypes.includes('store') ||
          itemCategory.includes('hotel')
        ) {
          return false;
        }
      }

      // ========================================================
      // STAGE 2: STRICT MATCHING RULES (ALLOW LIST)
      // ========================================================

      // 1. Restaurants Specific Allow Rule
      if (catId === '1') {
        return (
          itemTypes.includes('restaurant') ||
          itemTypes.includes('food') ||
          itemCategory.includes('restaurant')
        );
      }

      // 2. Hotels Specific Allow Rule
      if (catId === '2') {
        return (
          itemTypes.includes('hotel') ||
          itemTypes.includes('motel') ||
          itemTypes.includes('resort') ||
          itemTypes.includes('lodging') ||
          itemCategory.includes('hotel') ||
          itemCategory.includes('lodging')
        );
      }

      // 3. Cafe Specific Allow Rule
      if (catId === '3') {
        return (
          itemTypes.includes('cafe') ||
          itemTypes.includes('coffee_shop') ||
          itemCategory.includes('cafe') ||
          itemCategory.includes('coffee') ||
          itemName.includes('cafe') ||
          itemName.includes('coffee')
        );
      }

      // 4. RV Parks Specific Allow Rule
      if (catId === '4') {
        return (
          itemTypes.includes('rv_park') ||
          itemTypes.includes('campground') ||
          itemTypes.includes('lodging') ||
          itemName.includes('rv') ||
          itemName.includes('rv park') ||
          itemName.includes('campground') ||
          itemName.includes('campsite') ||
          itemName.includes('camp') ||
          itemName.includes('recreation') ||
          itemCategory.includes('rv') ||
          itemCategory.includes('campground') ||
          itemCategory.includes('recreation')
        );
      }

      // 5. To Do Near Me Specific Allow Rule
      if (catId === '5') {
        return (
          itemTypes.includes('tourist_attraction') ||
          itemTypes.includes('zoo') ||
          itemTypes.includes('museum') ||
          itemTypes.includes('amusement_park') ||
          itemTypes.includes('art_gallery') ||
          itemTypes.includes('aquarium') ||
          itemTypes.includes('bowling_alley') ||
          itemTypes.includes('stadium') ||
          itemTypes.includes('movie_theater') ||
          itemTypes.includes('library') ||
          itemCategory.includes('attraction') ||
          itemCategory.includes('museum') ||
          itemCategory.includes('park') ||
          itemName.includes('zoo') ||
          itemName.includes('museum') ||
          itemName.includes('park') ||
          itemName.includes('center')
        );
      }

      // 6. Shopping Specific Allow Rule (FIXED LOGIC)
      if (catId === '6') {
        return (
          itemTypes.includes('store') ||
          itemTypes.includes('shopping_mall') ||
          itemTypes.includes('clothing_store') ||
          itemTypes.includes('department_store') ||
          itemTypes.includes('supermarket') ||
          itemCategory.includes('store') ||
          itemCategory.includes('shop') ||
          itemCategory.includes('shopping') ||
          itemName.includes('shop') ||
          itemName.includes('store')
        );
      }

      // 7. General Fallbacks if no ID matched above
      if (catType && itemTypes.includes(catType)) {
        return true;
      }

      if (
        catName &&
        itemCategory &&
        (itemCategory.includes(catName) || catName.includes(itemCategory))
      ) {
        return true;
      }

      if (selectedCategory?.keyword) {
        const keywordsArray = selectedCategory.keyword.toLowerCase().split(' ');
        return itemTypes.some(t => keywordsArray.includes(t));
      }

      return false;
    });
  }, [recommendedLocations, selectedCategory]);

  const displayedNearby = useMemo(() => {
    if (!selectedCategory) {
      return fetchedLocations;
    }
    if (selectedCategory.type === 'restaurant') {
      return fetchedLocations.filter(item => {
        const itemTypes = (item?.types || []).map(t => t.toLowerCase());
        const itemCategory = item?.category?.toLowerCase() || '';
        const otherSpecTypes = ['bar', 'cafe', 'lodging'];
        return (
          !itemTypes.some(t => otherSpecTypes.includes(t)) &&
          !otherSpecTypes.some(t => itemCategory.includes(t))
        );
      });
    }
    return fetchedLocations;
  }, [fetchedLocations, selectedCategory]);

  const getDisplayCategory = useCallback(item => {
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
  }, []);

  const fetchRecommendedData = useCallback(
    async (currentLiked = [], currentWishlist = []) => {
      const loc =
        currentLocation?.latitude && currentLocation?.longitude
          ? currentLocation
          : DEFAULT_LOCATION;

      try {
        const broadResults = await FetchNearbyPlaces(
          loc,
          dispatch,
          'all',
          '',
          'skip',
        );

        let targetedResults = [];
        const rawInterests = [...currentLiked, ...currentWishlist].flatMap(
          item => {
            const cats = [];
            if (item?.category) cats?.push(item?.category?.toLowerCase());
            if (item?.types && Array?.isArray(item?.types)) {
              cats?.push(...item?.types.map(t => t?.toLowerCase()));
            }
            return cats;
          },
        );

        const filterTypes = [
          'point_of_interest',
          'establishment',
          'food',
          'restaurant',
          'health',
          'store',
          'natural_feature',
        ];

        const filteredRaw = rawInterests.filter(
          cat => cat && !filterTypes.includes(cat),
        );

        const frequencyMap = {};
        filteredRaw.forEach(cat => {
          const normalized =
            cat?.trim?.()?.toLowerCase?.()?.replace(/\s+/g, '_') || '';
          frequencyMap[normalized] = (frequencyMap[normalized] || 0) + 1;
        });

        const sortedInterests = Object.keys(frequencyMap).sort(
          (a, b) => frequencyMap[b] - frequencyMap[a],
        );

        const topInterests = sortedInterests.slice(0, 5);

        if (topInterests.length > 0) {
          const targetedFetches = topInterests.map(interest => {
            const keyword = interest.replace(/_/g, ' ');
            return FetchNearbyPlaces(loc, dispatch, interest, keyword, 'skip');
          });
          const resultsArray = await Promise.all(targetedFetches);
          targetedResults = resultsArray.flat();
        }

        const combined = [...broadResults, ...targetedResults];
        const uniqueMap = new Map();
        combined.forEach(item => {
          const id = item.place_id || item.placeId || item?._id;
          if (id && !uniqueMap.has(id)) {
            uniqueMap.set(id, item);
          }
        });

        const finalSet = Array.from(uniqueMap.values());
        dispatch(setRecommendedPlaces(finalSet));
      } catch (error) {
        console.log('Error fetching recommended data:', error);
      }
    },
    [currentLocation, dispatch],
  );

  const fetchData = useCallback(
    async (showLoader = true) => {
      const loc =
        currentLocation?.latitude && currentLocation?.longitude
          ? currentLocation
          : DEFAULT_LOCATION;

      if (showLoader) setIsLoading(true);
      await FetchNearbyPlaces(
        loc,
        dispatch,
        selectedCategory ? selectedCategory.type : 'all',
        selectedCategory?.keyword || '',
      );
      if (showLoader) setIsLoading(false);

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
    },
    [
      currentLocation,
      dispatch,
      selectedCategory,
      headerAnim,
      recommendedAnim,
      nearbyAnim,
    ],
  );

  const handleSearch = useCallback(
    async query => {
      const loc =
        currentLocation?.latitude && currentLocation?.longitude
          ? currentLocation
          : DEFAULT_LOCATION;

      setIsLoading(true);
      await FetchNearbyPlaces(loc, dispatch, '', query);
      setIsLoading(false);
    },
    [currentLocation, dispatch],
  );

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getAllNotifications(token);
      if (res?.success && Array.isArray(res?.data)) {
        const unreadNotifications = res.data.filter(item => !item.read);
        setIsRead(unreadNotifications.length > 0 ? false : true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [token]);

  useEffect(() => {
    const showLoader = isFirstLoad.current;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
    fetchData(showLoader);
    if (token) {
      fetchRecommendedData(likedItems, wishlistItems);
    }
  }, [
    currentLocation,
    selectedCategory,
    fetchData,
    fetchRecommendedData,
    likedItems,
    wishlistItems,
    token,
  ]);

  useEffect(() => {
    fetchNotifications();
  }, [isFocussed, fetchNotifications]);

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
        await fetchCustomCategories();
      } catch (error) {
        console.log('Error refreshing data:', error);
      }
    }
    await fetchData(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const refreshAllData = async () => {
      if (!token) return;
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

        fetchRecommendedData(freshLiked, freshWishlist);
        await fetchCustomCategories();
      } catch (error) {
        console.log('Error refreshing data on Home focus:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', refreshAllData);
    refreshAllData();
    return unsubscribe;
  }, [
    navigation,
    token,
    currentLocation,
    fetchCustomCategories,
    fetchRecommendedData,
  ]);

  const settings = useSelector(state => state.user.notificationSettings);

  useEffect(() => {
    const initBackgroundService = async () => {
      if (!token || !settings?.backgroundLocation) {
        await stopBackgroundService();
        return;
      }
      await startBackgroundService();
    };

    initBackgroundService();
  }, [token, settings?.backgroundLocation]);

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 2) {
      handleSearch(debouncedSearch);
    }
  }, [debouncedSearch, handleSearch]);

  const renderHeader = () => (
    <View>
      <LineBreak space={3} />
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
            onPress={() => navigateToRoute('Notifications')}
            style={styles.notificationBtn}>
            <Image
              source={isRead ? AppImages.bell : AppImages.bellWithDot}
              style={styles.notificationIcon}
            />
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
          <Ionicons name="basket" size={16} color="#FF9800" />
          <AppText
            title={`${wishlistItems.length} Bucket List`}
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

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}>

          {/* Custom Categories */}
          {filterCategories.map(category => {
            const isActive = selectedCategory?.id === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => setSelectedCategory(isActive ? null : category)}
                onLongPress={() => handleCategoryLongPress(category)}
                activeOpacity={0.7}>
                <View style={styles.tabContent}>
                  <Ionicons
                    name={category.icon}
                    size={15}
                    color={isActive ? '#FFF' : '#47082E'}
                  />
                  <AppText
                    title={category.name}
                    textColor={isActive ? AppColors.WHITE : AppColors.GRAY}
                    textSize={1.5}
                    textFontWeight={isActive}
                    paddingLeft={1}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Predefined Categories */}
          {CATEGORIES.map(category => {
            const isActive = selectedCategory?.id === category?.id;
            return (
              <TouchableOpacity
                key={category?.id}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => setSelectedCategory(isActive ? null : category)}
                activeOpacity={0.7}>
                <View style={styles.tabContent}>
                  {category?.library === 'Ionicons' ? (
                    <Ionicons
                      name={category?.icon}
                      size={15}
                      color={isActive ? '#FFF' : '#47082E'}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={15}
                      color={isActive ? '#FFF' : '#47082E'}
                    />
                  )}
                  <AppText
                    title={category.name}
                    textColor={isActive ? AppColors.WHITE : AppColors.GRAY}
                    textSize={1.5}
                    textFontWeight={isActive}
                    paddingLeft={1}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <LineBreak space={1} />

      {includeShowBranding &&
        settings?.recommendations &&
        !selectedCategory?.isCustom && (
          <Fragment>
            <View style={{paddingHorizontal: responsiveWidth(5)}}>
              <View style={styles.sectionHeader}>
                <AppText
                  title={
                    selectedCategory
                      ? `Recommended ${selectedCategory.name}`
                      : 'Recommended'
                  }
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
                  outputRange: [0.1, 1],
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
                data={displayedRecommended}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => `rec-${index}`}
                ListEmptyComponent={
                  <View
                    style={{
                      paddingVertical: responsiveHeight(2),
                      paddingLeft: responsiveWidth(1),
                    }}>
                    <AppText
                      title={
                        selectedCategory
                          ? `No recommended ${selectedCategory.name.toLowerCase()} found`
                          : 'No recommended places found'
                      }
                      textColor={AppColors.GRAY}
                      textSize={1.4}
                    />
                  </View>
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
                title={
                  selectedCategory
                    ? `Discover ${selectedCategory.name} Nearby`
                    : 'Discover Places Nearby'
                }
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

  return (
    <ScreenWrapper>
      {isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
        </View>
      ) : (
        <FlatList
          data={
            selectedCategory?.isCustom
              ? customCategoryItems
              : includeShowBranding
              ? displayedNearby
              : []
          }
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
            selectedCategory?.isCustom ? (
              customCategoryItems.length === 0 ? (
                <View style={{paddingHorizontal: responsiveWidth(5)}}>
                  <AppText
                    title={`No places added to "${selectedCategory.name}"`}
                  />
                </View>
              ) : null
            ) : includeShowBranding && displayedNearby.length === 0 ? (
              <View style={{paddingHorizontal: responsiveWidth(5)}}>
                <AppText
                  title={
                    selectedCategory
                      ? `No ${selectedCategory.name.toLowerCase()} found nearby`
                      : 'No places found nearby'
                  }
                />
              </View>
            ) : null
          }
          renderItem={({item}) => (
            <Animated.View
              style={{
                opacity: nearbyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 1],
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
                address={item?.vicinity || item?.address}
                category={selectedCategory?.name || getDisplayCategory(item)}
                CardImg={item?.photos?.[0]?.photo_reference || item?.image}
                cardOnPress={() =>
                  navigateToRoute('HomeDetails', {placeDetails: item})
                }
              />
            </Animated.View>
          )}
        />
      )}

      {/* Delete Category Modal (Long-press to delete custom category) */}
      <Modal
        isVisible={deleteModalVisible}
        backdropOpacity={0.5}
        onBackdropPress={() => {
          if (!isDeletingCategory) setDeleteModalVisible(false);
        }}
        onBackButtonPress={() => {
          if (!isDeletingCategory) setDeleteModalVisible(false);
        }}
        animationIn="zoomIn"
        animationOut="zoomOut"
        style={{margin: 0, justifyContent: 'center', alignItems: 'center'}}>
        <View style={styles.alertModalContent}>
          <AppText
            title="Delete Category"
            textColor={AppColors.BLACK}
            textSize={2.2}
            textFontWeight
          />
          <AppText
            title={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
            textColor={AppColors.GRAY}
            textSize={1.6}
            marginTop={2}
            paddingBottom={2}
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.modalCancelBtn}
              disabled={isDeletingCategory}
              onPress={() => setDeleteModalVisible(false)}>
              <AppText
                title="Cancel"
                textColor={AppColors.BLACK}
                textSize={1.8}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.modalDeleteBtn}
              disabled={isDeletingCategory}
              onPress={handleDeleteCategory}>
              {isDeletingCategory ? (
                <ActivityIndicator color={AppColors.WHITE} />
              ) : (
                <AppText
                  title="Delete"
                  textColor={AppColors.WHITE}
                  textSize={1.8}
                  textFontWeight
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default Home;

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
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    maxWidth: responsiveWidth(40),
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.LIGHTGRAY,
  },
  notificationBtn: {
    backgroundColor: AppColors.BTNCOLOURS,
    borderWidth: 1,
    borderColor: AppColors.menuBg,
    height: 50,
    width: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 25,
    height: 25,
    tintColor: '#FFF',
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
  tabContainer: {
    paddingVertical: responsiveHeight(1.5),
    backgroundColor: 'transparent',
    marginBottom: responsiveHeight(1),
  },
  tabScrollContent: {
    paddingHorizontal: responsiveWidth(5),
    gap: 10,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: AppColors.ThemeBlue,
    // borderWidth: 1,
    // borderColor: AppColors.menuBg,
  },
  activeTabItem: {
    backgroundColor: '#47082E',
    borderColor: '#47082E',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBarContainer: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(1),
  },
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  modalContent: {
    backgroundColor: AppColors.WHITE,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    width: '100%',
    maxHeight: responsiveHeight(70),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  confirmBtn: {
    backgroundColor: AppColors.BTNCOLOURS,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModalContent: {
    backgroundColor: AppColors.WHITE,
    borderRadius: 20,
    padding: 24,
    width: responsiveWidth(85),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
