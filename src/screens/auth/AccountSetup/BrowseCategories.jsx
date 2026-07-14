/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import {useDispatch, useSelector} from 'react-redux';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';

// Components & Utils
import AppText from '../../../components/AppTextComps/AppText';
import AppColors from '../../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from '../../../utils/Responsive_Dimensions';
import {useCustomNavigation, useDebounce} from '../../../utils/Hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import BackgroundScreen from '../../../components/AppTextComps/BackgroundScreen';
import ShowError from '../../../utils/ShowError';
import {ShowToast} from '../../../utils/api_content';

// Logic & API
import {setIsListBuilt} from '../../../redux/Slices';
import {
  createCustomCategory,
  getCustomCategories,
  deleteCustomCategory,
} from '../../../GlobalFunctions/main';
import FetchNearbyPlaces from '../../../ApiCalls/Main/FetchNearbyPlaces';
import {
  GetReviews,
  RemoveReview,
  AddReviews,
  updateReviews,
} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {
  AddWishList,
  GetWishList,
  RemoveWishList,
} from '../../../ApiCalls/Main/WishList_API/WishListAPI';
import {Google_Places_Images} from '../../../utils/api_content';
import ScreenWrapper from '../../../components/ScreenWrapper';
import RemoveReviewModal from '../../../components/RemoveReviewModal';
import {getCategory} from '../../../utils/functions';

const BrowseCategories = ({navigation}) => {
  const {navigateToRoute, goBack} = useCustomNavigation();
  const dispatch = useDispatch();
  const userSelector = useSelector(state => state.user);

  const {token, userData, current_location, places_nearby, isListBuilt} =
    userSelector;

  const [selectedCategory, setSelectedCategory] = useState('Restaurants');
  const [customPlace, setCustomPlace] = useState('');
  const [loading, setLoading] = useState(false);

  // Local state for counts and tracking
  const [likesCount, setLikesCount] = useState(0);
  const [hatesCount, setHatesCount] = useState(0);
  const [likedItems, setLikedItems] = useState([]);
  const [avoidItems, setAvoidItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Category state
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const debouncedSearch = useDebounce(customPlace, 600);
  const subscription = userData?.subscription;
  const subscriptionName =
    userData?.subscription?.subscriptionName || userData?.subscription?.plan;
  const isActiveSubscription =
    userData?.subscription?.subscriptionStatus === 'active';
  const isIndividualSubscription =
    isActiveSubscription && subscriptionName?.includes('Individual');
  const premiumSubscriber =
    isActiveSubscription && subscriptionName?.includes('Premium');

  const categories = useMemo(
    () => [
      {
        id: '1',
        name: 'Restaurants',
        icon: 'restaurant-outline',
        type: 'restaurant',
        keyword: 'restaurant', //  eat food dining eat-out takeaway delivery
        library: 'Ionicons',
      },
      {
        id: '2',
        name: 'Hotel',
        icon: 'office-building',
        type: 'lodging',
        keyword: 'hotel', // inn motel accommodation stay overnight lodging
        library: 'MaterialCommunityIcons',
      },
      {
        id: '3',
        name: 'Cafes',
        icon: 'cafe-outline',
        type: 'cafe',
        keyword: 'cafe', // coffee shop tea lounge
        library: 'Ionicons',
      },
      {
        id: '4',
        name: 'Campgrounds', // RV Parks & Recreation
        icon: 'rv-truck',
        type: 'rv_park',
        keyword: 'rv park', // recreation rv-park camping campground campsite
        library: 'MaterialCommunityIcons',
      },
      {
        id: '5',
        name: 'To do Near Me',
        icon: 'map-outline',
        type: '',
        keyword: 'zoo museum', // science center art show
        library: 'Ionicons',
      },
      {
        id: '6',
        name: 'Shopping',
        icon: 'cart-outline',
        type: '',
        keyword: 'shopping', // mall store clothing_store',
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
        keyword:
          'gym fitness workout health exercise sports equipment training',
        library: 'Ionicons',
      },
    ],
    [],
  );

  // Fetch existing custom categories
  const fetchCustomCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getCustomCategories(token);
      if (res?.success && res?.customCategories) {
        const sortedCategories = [...res.customCategories].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        console.log('resss:-', res.customCategories);
        setCustomCategories(sortedCategories);
      } else {
        setCustomCategories([]);
      }
    } catch (error) {
      console.log('Error fetching custom categories:', error);
    }
  }, [token]);

  const handleCreateCategory = async () => {
    const titleTrimmed = newCategoryTitle.trim();

    // 1. Validation Check: Input empty nahi hona chahiye
    if (!titleTrimmed) {
      ShowToast('error', 'Please enter a category title.');
      return;
    }

    // 2. Global Subscription Security Gate
    if (!isActiveSubscription) {
      ShowToast(
        'info',
        'Purchase any Individual subscription to create custom categories.',
      );
      setTimeout(() => {
        setAddCategoryModalVisible(false);
        navigation.navigate('Subscriptions');
      }, 2000);
      return;
    }

    // 3. CORE LOGIC EVALUATION
    const currentCount = customCategories?.length || 0;

    // SCENARIO A: User is Individual Premium (Unlimited creation access)
    if (premiumSubscriber) {
      await executeCategoryCreationAPI(titleTrimmed);
      return;
    }

    // SCENARIO B: User is Individual Basic
    if (isIndividualSubscription) {
      if (currentCount === 0) {
        // First category is free under basic tier standard
        await executeCategoryCreationAPI(titleTrimmed);
      } else {
        // Attempting to make more than 1 category requires explicit $3 execution prompt
        Alert.alert(
          'Limit Reached (Basic Plan)',
          'Your Basic plan includes 1 free custom category. Would you like to pay $3.00 to unlock an additional custom category slots?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Pay $3.00 Now',
              onPress: () => {
                console.log(
                  '[IAP Simulation] Executing microtransaction for $3...',
                );
                setAddCategoryModalVisible(false);
                navigateToRoute('Payment');
                // executeCategoryCreationAPI(titleTrimmed);
              },
            },
          ],
          {cancelable: true},
        );
      }
      return;
    }

    // Fallback safeguard logic (e.g. Couples plans or unhandled states)
    await executeCategoryCreationAPI(titleTrimmed);
  };

  // Dedicated abstraction helper to keep your API calling logic clean
  const executeCategoryCreationAPI = async categoryTitle => {
    setIsCreatingCategory(true);
    try {
      const res = await createCustomCategory(token, categoryTitle);
      if (res?.success) {
        ShowToast('success', 'Category created successfully!');
        setNewCategoryTitle('');
        setAddCategoryModalVisible(false);
        await fetchCustomCategories(); // Synchronize lists layout
      } else {
        ShowToast('error', res?.message || 'Failed to create category.');
      }
    } catch (error) {
      console.log('Error executing category creation flow:', error);
      ShowToast('error', 'An error occurred while linking container database.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleLongPressCustomCategory = cat => {
    setCategoryToDelete(cat);
    setDeleteModalVisible(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      const res = await deleteCustomCategory(token, categoryToDelete._id);
      if (res?.success) {
        ShowToast('success', 'Category deleted successfully!');
        setDeleteModalVisible(false);
        if (selectedCategory === categoryToDelete.title) {
          setSelectedCategory('Restaurants');
        }
        setCategoryToDelete(null);
        await fetchCustomCategories();
      } else {
        ShowToast('error', res?.message || 'Failed to delete category.');
      }
    } catch (error) {
      console.log('Error deleting category:', error);
      ShowToast('error', 'An error occurred.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  useEffect(() => {
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  // 1. Initial Data Load
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) return;
      const [revRes, wishRes] = await Promise.all([
        GetReviews(token),
        GetWishList(token),
      ]);
      if (revRes?.reviews) {
        const liked = revRes.reviews.filter(r => r.actionType === 'Go Again');
        const avoided = revRes.reviews.filter(r => r.actionType === 'Avoid');
        setLikedItems(liked);
        setLikesCount(liked.length);
        setAvoidItems(avoided);
        setHatesCount(avoided.length);
      }
      const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
      if (wishlistData && Array.isArray(wishlistData)) {
        setWishlistItems(wishlistData);
        setWishlistCount(wishlistData.length);
      }
    };
    fetchInitialData();
  }, [token]);

  // Derived: is the selected category a custom one?
  const isCustomSelected = useMemo(() => {
    return customCategories.some(c => c.title === selectedCategory);
  }, [customCategories, selectedCategory]);

  // Derived: items of the currently selected custom category
  const customCategoryItems = useMemo(() => {
    if (!isCustomSelected) return [];
    const found = customCategories
      ?.sort()
      ?.find(c => c.title === selectedCategory);
    return found?.items || [];
  }, [isCustomSelected, customCategories, selectedCategory]);

  // 2. Fetch Places based on category or search
  const fetchPlaces = useCallback(
    async (query = '') => {
      if (!current_location?.latitude) return;
      // Skip Google Places fetch when a custom category is selected
      if (isCustomSelected) return;
      setLoading(true);
      const cat = categories.find(c => c.name === selectedCategory);
      const type = query ? '' : cat?.type || '';
      const keyword = query || cat?.keyword || '';
      await FetchNearbyPlaces(current_location, dispatch, type, keyword);
      setLoading(false);
    },
    [
      selectedCategory,
      isCustomSelected,
      current_location,
      categories,
      dispatch,
    ],
  );

  useEffect(() => {
    fetchPlaces(debouncedSearch);
  }, [selectedCategory, debouncedSearch, fetchPlaces]);

  // 3. Action Handlers (Go Again / Avoid / Wish List — mutually exclusive)
  const handleAction = async (item, actionType) => {
    if (actionLoading) return;
    const isGoAgain = actionType === 'Go Again';
    const isAvoid = actionType === 'Avoid';

    setActionLoading(true);

    const processSingleAction = async place => {
      const data = {
        placeId: place.place_id || place.placeId,
        restaurantName: place.name || place.restaurantName,
        address: place.vicinity || place.formatted_address || place.address,
        rating: place.rating || 0,
        reviewText: 'Added from browsing',
        actionType: actionType,
        photos: place.photos?.[0]?.photo_reference
          ? [`${Google_Places_Images}${place.photos[0].photo_reference}`]
          : place.photos || [],
        category: getCategory(place) || 'Browse Categories',
        latitude: place.geometry?.location?.lat || place.latitude,
        longitude: place.geometry?.location?.lng || place.longitude,
        avoidAllBranches: false,
      };

      console.log('data:-', data);
      try {
        const res = await AddReviews(token, data);
        return res;
      } catch (e) {
        console.log('Error in processSingleAction:', e);
        return {success: false};
      }
    };

    try {
      // Toggle off if already in this list
      const targetList = isGoAgain ? likedItems : avoidItems;
      const existing = targetList.find(i => i.placeId === item.place_id);
      if (existing) {
        if (isAvoid && existing.avoidAllBranches) {
          setActionLoading(false);
          return;
        }
        const res = await RemoveReview({reviewId: existing._id}, token);
        if (res?.success) {
          if (isGoAgain) {
            setLikesCount(p => p - 1);
            setLikedItems(p => p.filter(l => l._id !== existing._id));
          } else {
            setHatesCount(p => p - 1);
            setAvoidItems(p => p.filter(a => a._id !== existing._id));
          }
          ShowError(`Removed from ${actionType} list`);
        }
      } else {
        // Mutual exclusivity logic
        const oppositeList = isGoAgain ? avoidItems : likedItems;
        const existingOpposite = oppositeList.find(
          i => i.placeId === item.place_id,
        );
        if (existingOpposite) {
          const remRes = await RemoveReview(
            {reviewId: existingOpposite._id},
            token,
          );
          if (remRes?.success) {
            if (isGoAgain) {
              setHatesCount(p => p - 1);
              setAvoidItems(p => p.filter(a => a._id !== existingOpposite._id));
            } else {
              setLikesCount(p => p - 1);
              setLikedItems(p => p.filter(l => l._id !== existingOpposite._id));
            }
          }
        }

        const existingWish = wishlistItems.find(
          w => w.placeId === item.place_id,
        );
        if (existingWish) {
          const remRes = await RemoveWishList(token, {placeId: item.place_id});
          if (remRes?.success) {
            setWishlistCount(p => p - 1);
            setWishlistItems(p => p.filter(w => w.placeId !== item.place_id));
          }
        }

        const res = await processSingleAction(item);
        if (res?.success) {
          if (isGoAgain) {
            setLikesCount(p => p + 1);
            setLikedItems(p => [
              ...p,
              {_id: res.review?._id, placeId: item.place_id},
            ]);
          } else {
            setHatesCount(p => p + 1);
            setAvoidItems(p => [
              ...p,
              {_id: res.review?._id, placeId: item.place_id},
            ]);
          }
          ShowError(`Added to ${actionType} list`);
        }
      }
    } catch (e) {
      console.log('Action error:', e);
      ShowError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  // Wish List Handler (mutually exclusive with Go Again & Avoid)
  const handleWishlistToggle = async item => {
    try {
      // Toggle off if already wishlisted
      const existing = wishlistItems.find(w => w.placeId === item.place_id);
      if (existing) {
        console.log('Removing from wishlist:', item.place_id);
        const res = await RemoveWishList(token, {placeId: item.place_id});
        console.log('RemoveWishList response in BrowseCategories:', res);
        if (res?.success) {
          setWishlistCount(p => p - 1);
          setWishlistItems(p => p.filter(w => w.placeId !== item.place_id));
          ShowError('Removed from Bucket List Successfully.');
        } else {
          ShowError(res?.message || 'Failed to remove from Bucket List');
        }
        return;
      }

      // Mutual exclusivity: remove from Go Again if present
      const existingLike = likedItems.find(l => l.placeId === item.place_id);
      if (existingLike) {
        const remRes = await RemoveReview({reviewId: existingLike._id}, token);
        if (remRes?.success) {
          setLikesCount(p => p - 1);
          setLikedItems(p => p.filter(l => l._id !== existingLike._id));
        }
      }

      // Mutual exclusivity: remove from Avoid if present
      const existingAvoid = avoidItems.find(a => a.placeId === item.place_id);
      if (existingAvoid) {
        const remRes = await RemoveReview({reviewId: existingAvoid._id}, token);
        if (remRes?.success) {
          setHatesCount(p => p - 1);
          setAvoidItems(p => p.filter(a => a._id !== existingAvoid._id));
        }
      }

      // Add to wish list
      const data = {
        placeId: item.place_id,
        name: item.name,
        address: item.vicinity || item.formatted_address,
        image: item.photos?.[0]?.photo_reference || '',
        rating: item.rating || 0,
        userRatingsTotal: item.user_ratings_total || 0,
        category: getCategory(item) || 'Browse Categories',
        notes: '',
        isVisited: false,
      };

      console.log('Adding to wishlist:', item.place_id);
      const res = await AddWishList(token, data);
      console.log('AddWishList response in BrowseCategories:', res);
      if (res?.success) {
        setWishlistCount(p => p + 1);
        setWishlistItems(p => [...p, {placeId: item.place_id, ...data}]);
        ShowError('Added to Bucket List Successfully.');
      } else {
        ShowError(res?.message || 'Failed to add to Bucket List');
      }
    } catch (error) {
      console.log('handleWishlistToggle error:', error);
      ShowError('Something went wrong');
    }
  };

  // 4. Sub-renderers
  const renderPlaceItem = ({item}) => {
    // Custom category items come with direct fields (placeId, image, address, latitude/longitude)
    // Google Places items have place_id, photos[], vicinity
    const isCustomItem = !!item.placeId && !item.place_id;

    const imageUrl = isCustomItem
      ? item.image || null
      : item.photos?.[0]?.photo_reference
      ? `${Google_Places_Images}${item.photos[0].photo_reference}&maxwidth=200`
      : null;

    const placeId = item.place_id || item.placeId;
    const address =
      item.vicinity || item.formatted_address || item.address || 'Nearby';

    const isLiked = likedItems.some(l => l.placeId === placeId);
    const isAvoided = avoidItems.some(a => a.placeId === placeId);
    const isWishlisted =
      !isLiked && !isAvoided && wishlistItems.some(w => w.placeId === placeId);

    return (
      <TouchableOpacity
        onPress={() =>
          navigateToRoute('HomeDetails', {
            placeDetails: isCustomItem
              ? {
                  place_id: item.placeId,
                  name: item.name,
                  vicinity: item.address,
                  rating: item.rating,
                  image: item.image,
                  latitude: item.latitude,
                  longitude: item.longitude,
                }
              : item,
          })
        }
        style={styles.placeItem}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.placeImage} />
        ) : (
          <View style={[styles.placeImage, styles.center]}>
            <Ionicons name="image-outline" size={24} color="#CCC" />
          </View>
        )}

        <View style={{marginLeft: 12, flex: 1}}>
          <AppText
            title={item.name}
            textSize={1.7}
            textFontWeight
            textColor="#47082E"
            numberOfLines={1}
          />
          <AppText title={selectedCategory} textSize={1.3} textColor="#666" />
          <AppText
            title={address}
            textSize={1.3}
            textColor="#666"
            numberOfLines={1}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleAction(item, 'Go Again')}
            style={styles.circleActionBtn}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#4CAF50' : '#47082E'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAction(item, 'Avoid')}
            style={styles.circleActionBtn}>
            <Ionicons
              name={isAvoided ? 'thumbs-down' : 'thumbs-down-outline'}
              size={22}
              color={isAvoided ? '#D32F2F' : '#47082E'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleWishlistToggle(item)}
            style={styles.circleActionBtn}>
            <Ionicons
              name={isWishlisted ? 'basket' : 'basket-outline'}
              size={22}
              color={isWishlisted ? '#FF9800' : '#47082E'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={{paddingBottom: 10}}>
      <AppText
        title={
          'Quickly build your love/hate lists.\nTap hearts or thumbs down!'
        }
        textSize={1.7}
        textColor="#47082E"
        textAlignment="center"
        marginTop={2}
      />

      <View style={styles.statsRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyLikes')}
          style={styles.statChip}>
          <Ionicons name="heart" size={16} color="#4CAF50" />
          <AppText
            title={`${likesCount} Go Again`}
            textSize={1.3}
            textColor="#4CAF50"
            textFontWeight
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MyHates')}
          style={styles.statChip}>
          <Ionicons name="thumbs-down" size={16} color="#D32F2F" />
          <AppText
            title={`${hatesCount} Avoid`}
            textSize={1.3}
            textColor="#D32F2F"
            textFontWeight
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('WishList')}
          style={styles.statChip}>
          <Ionicons name="basket" size={16} color="#FF9800" />
          <AppText
            title={`${wishlistCount} Bucket List`}
            textSize={1.3}
            textColor="#FF9800"
            textFontWeight
          />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                !isSelected && styles.categoryItemUnselected,
              ]}
              onPress={() => {
                setCustomPlace('');
                setSelectedCategory(cat.name);
              }}>
              {isSelected && (
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#EB864D" />
                      <Stop offset="100%" stopColor="#47082E" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" rx="18" fill="url(#grad)" />
                </Svg>
              )}
              {cat.library === 'Ionicons' ? (
                <Ionicons
                  name={cat.icon}
                  size={28}
                  color={isSelected ? '#FFF' : '#47082E'}
                />
              ) : (
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={28}
                  color={isSelected ? '#FFF' : '#47082E'}
                />
              )}
              <AppText
                title={cat.name}
                textSize={1.2}
                textColor={isSelected ? '#FFF' : '#47082E'}
                textFontWeight
                textAlignment="center"
                paddingHorizontal={2}
              />
            </TouchableOpacity>
          );
        })}

        {/* Custom Categories */}
        {customCategories.map(cat => {
          const isSelected = selectedCategory === cat.title;
          return (
            <TouchableOpacity
              key={cat._id}
              style={[
                styles.categoryItem,
                styles.customCategoryTile,
                isSelected && styles.customCategoryTileSelected,
              ]}
              onPress={() => {
                setCustomPlace('');
                setSelectedCategory(cat.title);
              }}
              onLongPress={() => handleLongPressCustomCategory(cat)}
              delayLongPress={400}
              activeOpacity={0.7}>
              {isSelected && (
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient
                      id={`grad-${cat._id}`}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%">
                      <Stop offset="0%" stopColor="#EB864D" />
                      <Stop offset="100%" stopColor="#47082E" />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    width="100%"
                    height="100%"
                    rx="18"
                    fill={`url(#grad-${cat._id})`}
                  />
                </Svg>
              )}
              <Ionicons
                name="star-outline"
                size={26}
                color={isSelected ? '#FFF' : '#47082E'}
              />
              <AppText
                title={cat.title}
                textSize={1.2}
                textColor={isSelected ? '#FFF' : '#47082E'}
                textFontWeight
                textAlignment="center"
                paddingHorizontal={2}
              />
            </TouchableOpacity>
          );
        })}

        {/* + Add Custom Category Button — always last */}
        <TouchableOpacity
          style={[styles.categoryItem, styles.addCategoryTile]}
          onPress={() => {
            const hasActiveSubscription =
              subscription &&
              subscription.subscriptionStatus !== 'expired' &&
              subscription.subscriptionStatus !== 'cancelled' &&
              subscription.status !== 'expired' &&
              subscription.status !== 'cancelled';
            if (!hasActiveSubscription) {
              ShowToast(
                'info',
                'Purchase any subscription to create custom categories.',
              );
              setTimeout(() => {
                navigation.navigate('Subscriptions');
              }, 1000);
              return;
            }
            setAddCategoryModalVisible(true);
          }}
          activeOpacity={0.7}>
          <Ionicons name="add" size={32} color="#47082E" />
          <AppText
            title="Add"
            textSize={1.2}
            textColor="#47082E"
            textFontWeight
            textAlignment="center"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarPill}>
          <Ionicons name="search-outline" size={20} color="#47082E" />
          <TextInput
            placeholder="Search for any specific place..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={customPlace}
            onChangeText={setCustomPlace}
          />
          {loading && <ActivityIndicator size="small" color="#47082E" />}
        </View>
      </View>
    </View>
  );

  // console.log('isListBuilt:-', isListBuilt);
  // console.log('subscription:-', userData?.subscription);
  // console.log('customCategories:-', customCategories);
  // console.log('subscriptionName:----------', subscriptionName);
  // console.log('isIndividualSubscription:----------', isIndividualSubscription);
  // console.log('premiumSubscriber:----------', premiumSubscriber);
  console.log(' current_location:----------', current_location);

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={AppColors.BTNCOLOURS}
            />
          </TouchableOpacity>
          <AppText
            title={'Browse Categories'}
            textSize={2.6}
            textColor={AppColors.BTNCOLOURS}
            textFontWeight
            style={{flex: 1, textAlign: 'center', marginRight: 40}}
          />
        </View>

        <FlatList
          data={isCustomSelected ? customCategoryItems : places_nearby}
          renderItem={renderPlaceItem}
          ListHeaderComponent={ListHeader()}
          keyExtractor={(item, index) =>
            item.place_id || item.placeId || String(index)
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View
                style={[
                  styles.center,
                  {paddingHorizontal: 30, paddingTop: 20},
                ]}>
                {isCustomSelected ? (
                  <>
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color="#47082E"
                      style={{opacity: 0.4, marginBottom: 10}}
                    />
                    <AppText
                      title={`"${selectedCategory}" is empty`}
                      textColor="#47082E"
                      textSize={1.8}
                      textFontWeight
                      textAlignment="center"
                    />
                    <AppText
                      title="No places have been added to this category yet."
                      textColor="#999"
                      textSize={1.4}
                      textAlignment="center"
                      marginTop={1}
                    />
                  </>
                ) : (
                  <AppText title="No places found nearby." textColor="#666" />
                )}
              </View>
            )
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (isListBuilt) {
                navigation.goBack();
              } else {
                dispatch(setIsListBuilt(true));
              }
            }}
            style={styles.continueButton}>
            <Svg
              height="58"
              width={responsiveWidth(90)}
              style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#EB864D" />
                  <Stop offset="100%" stopColor="#47082E" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="58" rx="29" fill="url(#btnGrad)" />
            </Svg>
            <AppText
              title={'Continue'}
              textSize={1.8}
              textColor={AppColors.WHITE}
              textFontWeight
            />
          </TouchableOpacity>
        </View>

        {/* Add Custom Category Modal */}
        <Modal
          isVisible={addCategoryModalVisible}
          backdropOpacity={0.5}
          onBackdropPress={() => {
            if (!isCreatingCategory) setAddCategoryModalVisible(false);
          }}
          onBackButtonPress={() => {
            if (!isCreatingCategory) setAddCategoryModalVisible(false);
          }}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={{margin: 0, justifyContent: 'flex-end'}}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText
                title="Create Custom Category"
                textColor="#47082E"
                textSize={2.2}
                textFontWeight
              />
              <TouchableOpacity
                disabled={isCreatingCategory}
                onPress={() => {
                  setAddCategoryModalVisible(false);
                  setNewCategoryTitle('');
                }}>
                <Ionicons name="close" size={24} color="#47082E" />
              </TouchableOpacity>
            </View>

            <AppText
              title="Category Title"
              textColor="#666"
              textSize={1.5}
              paddingBottom={1.5}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Sushi spots, Coffee places"
              placeholderTextColor="#999"
              value={newCategoryTitle}
              onChangeText={setNewCategoryTitle}
              editable={!isCreatingCategory}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.confirmBtn, isCreatingCategory && {opacity: 0.7}]}
              disabled={isCreatingCategory}
              onPress={handleCreateCategory}>
              {isCreatingCategory ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <AppText
                  title="Create"
                  textColor="#FFF"
                  textSize={1.8}
                  textFontWeight
                />
              )}
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Delete Custom Category Modal */}
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
          <View style={styles.deleteModalContent}>
            <Ionicons
              name="trash-outline"
              size={40}
              color="#47082E"
              style={{marginBottom: 10}}
            />
            <AppText
              title="Delete Category"
              textColor="#47082E"
              textSize={2.2}
              textFontWeight
            />
            <AppText
              title={`Are you sure you want to delete "${categoryToDelete?.title}"?`}
              textColor="#666"
              textSize={1.5}
              marginTop={2}
              textAlignment="center"
              paddingBottom={2}
            />
            <View style={styles.deleteModalButtonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.deleteCancelBtn}
                disabled={isDeletingCategory}
                onPress={() => setDeleteModalVisible(false)}>
                <AppText
                  title="Cancel"
                  textColor="#47082E"
                  textSize={1.8}
                  textFontWeight
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.deleteConfirmBtn,
                  isDeletingCategory && {opacity: 0.7},
                ]}
                disabled={isDeletingCategory}
                onPress={handleDeleteCategory}>
                {isDeletingCategory ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <AppText
                    title="Delete"
                    textColor="#FFF"
                    textSize={1.8}
                    textFontWeight
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {justifyContent: 'center', alignItems: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {padding: 5},
  listContent: {paddingBottom: 120},
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  categoryItem: {
    width: responsiveWidth(28),
    height: 90,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryItemUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  addCategoryTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 2,
    borderColor: '#47082E',
    borderStyle: 'dashed',
  },
  customCategoryTile: {
    backgroundColor: 'rgba(71, 8, 46, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(71, 8, 46, 0.3)',
    overflow: 'hidden',
  },
  customCategoryTileSelected: {
    borderWidth: 0,
  },
  deleteModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  deleteModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#47082E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#47082E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    width: '100%',
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
    backgroundColor: '#47082E',
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {paddingHorizontal: 20, marginVertical: 10},
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  searchInput: {flex: 1, marginLeft: 10, fontSize: 16, color: '#47082E'},
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  actionButtons: {flexDirection: 'row', gap: 8},
  circleActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    elevation: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    width: responsiveWidth(90),
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BrowseCategories;
