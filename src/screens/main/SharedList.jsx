/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';

// Components & Utils
import AppText from '../../components/AppTextComps/AppText';
import AppColors from '../../utils/AppColors';
import {
  responsiveWidth,
  responsiveHeight,
} from '../../utils/Responsive_Dimensions';
import {useCustomNavigation} from '../../utils/Hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ShowError from '../../utils/ShowError';

// Logic & API
import {
  AddReviews,
  GetReviews,
  RemoveReview,
} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {
  AddWishList,
  GetWishList,
  RemoveWishList,
} from '../../ApiCalls/Main/WishList_API/WishListAPI';
import {Google_Places_Images} from '../../utils/api_content';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import {GetSharedList} from '../../GlobalFunctions/main';
import {getCategory} from '../../utils/functions';

const SharedList = ({navigation, route}) => {
  let data = route?.params?.data;
  let name = data?.message?.split(' ')[0];
  let avoidIds = data?.metadata?.avoidIds || [];
  let goAgainIds = data?.metadata?.goAgainIds || [];
  let wishlistIds = data?.metadata?.wishlistIds || [];

  const {navigateToRoute} = useCustomNavigation();
  const {token, current_location} = useSelector(state => state.user);

  const [loading, setLoading] = useState(false);

  const [likedItems, setLikedItems] = useState([]);
  const [avoidItems, setAvoidItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [sharedPlaces, setSharedPlaces] = useState({
    goAgain: [],
    avoid: [],
    wishlist: [],
  });

  // 1. Sync current user's own lists
  const syncLists = async () => {
    if (!token) return;
    try {
      const [revRes, wishRes] = await Promise.all([
        GetReviews(token),
        GetWishList(token),
      ]);
      if (revRes?.reviews) {
        setLikedItems(revRes.reviews.filter(r => r.actionType === 'Go Again'));
        setAvoidItems(revRes.reviews.filter(r => r.actionType === 'Avoid'));
      }
      const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
      if (wishlistData && Array.isArray(wishlistData)) {
        setWishlistItems(wishlistData);
      }
    } catch (e) {
      console.log('Sync error:', e);
    }
  };

  // 2. Fetch shared places details from API
  const fetchSharedPlaces = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await GetSharedList(token, {
        wishlistIds,
        avoidIds,
        goAgainIds,
      });

      console.log('Shared List Response:-', res);

      if (res?.success && res.data) {
        const normalize = list =>
          (list || []).map(item => ({
            ...item,
            place_id: item.placeId || item.place_id,
          }));

        setSharedPlaces({
          goAgain: normalize(res.data.goAgain),
          avoid: normalize(res.data.avoid),
          wishlist: normalize(res.data.wishlist),
        });
      } else {
        ShowError(res?.message || 'Failed to fetch shared listings');
      }
    } catch (e) {
      console.log('Fetch shared places error:', e);
      ShowError('Something went wrong fetching listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncLists();
    fetchSharedPlaces();
  }, [token]);

  // 3. Heart (Go Again) Logic
  const handleHeart = async item => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const existing = likedItems.find(l => l.placeId === item.place_id);

      if (existing) {
        const res = await RemoveReview({reviewId: existing._id}, token);
        if (res?.success) {
          setLikedItems(prev => prev.filter(l => l._id !== existing._id));
          ShowError('Removed from Go Again');
        }
        return;
      }

      const inAvoid = avoidItems.find(a => a.placeId === item.place_id);
      if (inAvoid) {
        const revRes = await RemoveReview({reviewId: inAvoid._id}, token);
        if (revRes?.success) {
          setAvoidItems(prev => prev.filter(a => a._id !== inAvoid._id));
        }
      }

      // Exclusivity: Remove from Wishlist first
      const inWish = wishlistItems.find(w => w.placeId === item.place_id);
      if (inWish) {
        const wishRes = await RemoveWishList(token, {placeId: item.place_id});
        if (wishRes?.success) {
          setWishlistItems(prev =>
            prev.filter(w => w.placeId !== item.place_id),
          );
        }
      }

      const photosArr = item.photos || [];
      let imageUrlForPayload = null;
      if (photosArr.length > 0) {
        const photo = photosArr[0];
        if (typeof photo === 'string' && photo.startsWith('http')) {
          imageUrlForPayload = photo;
        } else if (photo?.photo_reference) {
          imageUrlForPayload = `${Google_Places_Images}${photo.photo_reference}`;
        }
      } else if (item.image) {
        imageUrlForPayload = item.image.startsWith('http')
          ? item.image
          : `${Google_Places_Images}${item.image}`;
      }

      const data = {
        placeId: item.place_id,
        restaurantName: item.restaurantName || item.name,
        address: item.address || item.vicinity || item.formatted_address,
        rating: item.rating || 0,
        reviewText: 'Added from Shared List',
        actionType: 'Go Again',
        photos: imageUrlForPayload ? [imageUrlForPayload] : [],
        category: getCategory(item) || 'Shared List',
        latitude: item.latitude || item.geometry?.location?.lat,
        longitude: item.longitude || item.geometry?.location?.lng,
      };

      const res = await AddReviews(token, data);
      if (res?.success) {
        setLikedItems(prev => [
          ...prev,
          {_id: res.review?._id, placeId: item.place_id},
        ]);
        ShowError('Added to Go Again');
      }
    } catch (e) {
      console.log('Heart error:', e);
      ShowError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Avoid Logic
  const handleAvoid = async item => {
    if (actionLoading) return;

    const existing = avoidItems.find(a => a.placeId === item.place_id);

    if (existing) {
      setActionLoading(true);
      try {
        const res = await RemoveReview({reviewId: existing._id}, token);
        if (res?.success) {
          setAvoidItems(prev => prev.filter(a => a._id !== existing._id));
          ShowError('Removed from Avoid');
        }
      } catch (e) {
        console.log('Remove avoid error:', e);
        ShowError('Something went wrong');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setActionLoading(true);

    const processSingleAvoid = async place => {
      const photosArr = place.photos || [];
      let imageUrlForPayload = null;
      if (photosArr.length > 0) {
        const photo = photosArr[0];
        if (typeof photo === 'string' && photo.startsWith('http')) {
          imageUrlForPayload = photo;
        } else if (photo?.photo_reference) {
          imageUrlForPayload = `${Google_Places_Images}${photo.photo_reference}`;
        }
      } else if (place.image) {
        imageUrlForPayload = place.image.startsWith('http')
          ? place.image
          : `${Google_Places_Images}${place.image}`;
      }

      const data = {
        placeId: place.place_id || place.placeId,
        restaurantName: place.restaurantName || place.name,
        address: place.address || place.vicinity || place.formatted_address,
        actionType: 'Avoid',
        photos: imageUrlForPayload ? [imageUrlForPayload] : [],
        category: getCategory(item) || 'Shared List',
        latitude: place.latitude || place.geometry?.location?.lat,
        longitude: place.longitude || place.geometry?.location?.lng,
      };

      try {
        const res = await AddReviews(token, data);
        return res;
      } catch (e) {
        console.log('Error avoiding place:', place.name, e);
        return {success: false};
      }
    };

    try {
      const inLiked = likedItems.find(l => l.placeId === item.place_id);
      if (inLiked) {
        const resLiked = await RemoveReview({reviewId: inLiked._id}, token);
        if (resLiked?.success) {
          setLikedItems(prev => prev.filter(l => l._id !== inLiked._id));
        }
      }

      // Exclusivity: Remove from Wishlist first
      const inWish = wishlistItems.find(w => w.placeId === item.place_id);
      if (inWish) {
        const wishRes = await RemoveWishList(token, {placeId: item.place_id});
        if (wishRes?.success) {
          setWishlistItems(prev =>
            prev.filter(w => w.placeId !== item.place_id),
          );
        }
      }

      const res = await processSingleAvoid(item);
      if (res?.success) {
        setAvoidItems(prev => [
          ...prev,
          {_id: res.review?._id, placeId: item.place_id},
        ]);
        ShowError('Added to Avoid');
      }
    } catch (e) {
      console.log('Avoid error:', e);
      ShowError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWishlistToggle = async item => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const existing = wishlistItems.find(w => w.placeId === item.place_id);
      if (existing) {
        const res = await RemoveWishList(token, {placeId: item.place_id});
        if (res?.success) {
          setWishlistItems(prev =>
            prev.filter(w => w.placeId !== item.place_id),
          );
          ShowError('Removed from Bucket List');
        } else {
          ShowError(res?.message || 'Failed to remove from Bucket List');
        }
        return;
      }

      // Mutual exclusivity: Remove from Go Again
      const inLiked = likedItems.find(l => l.placeId === item.place_id);
      if (inLiked) {
        const resLiked = await RemoveReview({reviewId: inLiked._id}, token);
        if (resLiked?.success) {
          setLikedItems(prev => prev.filter(l => l._id !== inLiked._id));
        }
      }

      // Mutual exclusivity: Remove from Avoid
      const inAvoid = avoidItems.find(a => a.placeId === item.place_id);
      if (inAvoid) {
        const resAvoid = await RemoveReview({reviewId: inAvoid._id}, token);
        if (resAvoid?.success) {
          setAvoidItems(prev => prev.filter(a => a._id !== inAvoid._id));
        }
      }

      const data = {
        placeId: item.place_id,
        name: item.restaurantName || item.name,
        address: item.address || item.vicinity || item.formatted_address,
        image: item.image || item.photos?.[0]?.photo_reference || '',
        rating: item.rating || 0,
        userRatingsTotal: item.userRatingsTotal || item.user_ratings_total || 0,
        category: getCategory(item),
        latitude: item.latitude || item.geometry?.location?.lat,
        longitude: item.longitude || item.geometry?.location?.lng,
        notes: '',
        isVisited: false,
      };

      const res = await AddWishList(token, data);
      if (res?.success) {
        setWishlistItems(prev => [...prev, {placeId: item.place_id, ...data}]);
        ShowError('Added to Bucket List');
      } else {
        ShowError(res?.message || 'Failed to add to Bucket List');
      }
    } catch (e) {
      console.log('Wishlist toggle error:', e);
      ShowError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Render Helpers
  const renderPlaceItem = ({item}) => {
    const name = item.restaurantName || item.name || 'No Name';
    const photosArr = item.photos || [];
    let imageUrl = null;

    if (photosArr.length > 0) {
      const photo = photosArr[0];
      if (typeof photo === 'string' && photo.startsWith('http')) {
        imageUrl = photo;
      } else if (photo?.photo_reference) {
        imageUrl = `${Google_Places_Images}${photo.photo_reference}&maxwidth=200`;
      }
    } else if (item.image) {
      imageUrl = `${Google_Places_Images}${item.image}&maxwidth=200`;
    }

    const isLiked = likedItems.some(l => l.placeId === item.place_id);
    const isAvoided = avoidItems.some(a => a.placeId === item.place_id);
    const isWishlisted =
      !isLiked &&
      !isAvoided &&
      wishlistItems.some(w => w.placeId === item.place_id);

    return (
      <TouchableOpacity
        onPress={() => navigateToRoute('HomeDetails', {placeDetails: item})}
        style={styles.placeItem}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.placeImage} />
        ) : (
          <View style={[styles.placeImage, styles.centerGray]}>
            <Ionicons name="image-outline" size={24} color="#CCC" />
          </View>
        )}
        <View style={{marginLeft: 15, flex: 1}}>
          <AppText
            title={name}
            textSize={1.7}
            textFontWeight
            textColor="#47082E"
            numberOfLines={1}
          />
          <AppText
            // title={getCategory(item) || 'Establishment'}
            title={item?.category || 'Establishment'}
            textSize={1.3}
            textColor="#666"
            numberOfLines={1}
          />
          <AppText
            title={item.vicinity || item.address || item.formattedAddress}
            textSize={1.1}
            textColor="#666"
            numberOfLines={2}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleHeart(item)}
            disabled={actionLoading}
            style={[styles.circleActionBtn, actionLoading && {opacity: 0.6}]}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#4CAF50' : '#47082E'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAvoid(item)}
            disabled={actionLoading}
            style={[styles.circleActionBtn, actionLoading && {opacity: 0.6}]}>
            <Ionicons
              name={isAvoided ? 'thumbs-down' : 'thumbs-down-outline'}
              size={22}
              color={isAvoided ? '#D32F2F' : '#47082E'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleWishlistToggle(item)}
            disabled={actionLoading}
            style={[styles.circleActionBtn, actionLoading && {opacity: 0.6}]}>
            <FontAwesome
              name={isWishlisted ? 'bookmark' : 'bookmark-o'}
              size={20}
              color={isWishlisted ? '#FF9800' : '#47082E'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={{paddingBottom: 10}}>
      {/* <AppText
        title={`${name} shared their listings with you.`}
        textSize={1.7}
        textColor="#47082E"
        textAlignment="center"
        style={{marginTop: 10}}
      /> */}

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
            title={`${wishlistItems.length} Bucket List`}
            textSize={1.3}
            textColor="#FF9800"
            textFontWeight
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={AppColors.BTNCOLOURS}
          style={{marginTop: 20}}
        />
      )}
    </View>
  );

  // console.log('Data:-', data);
  const hasData =
    sharedPlaces.goAgain.length > 0 ||
    sharedPlaces.avoid.length > 0 ||
    sharedPlaces.wishlist.length > 0;

  // console.log('sharedPlaces:-', sharedPlaces);

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <AppHeader onBackPress={true} heading={`${name}'s Shared Listing`} />

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {ListHeader()}

          {sharedPlaces?.goAgain?.length > 0 && (
            <View>
              <AppText
                title="Go Again List:"
                textSize={2}
                textFontWeight
                textColor="#47082E"
                paddingBottom={2}
              />
              {sharedPlaces?.goAgain?.map(item => (
                <View key={item?.place_id}>{renderPlaceItem({item})}</View>
              ))}
            </View>
          )}

          {sharedPlaces?.avoid?.length > 0 && (
            <View>
              <AppText
                title="Avoid List:"
                textSize={2}
                textFontWeight
                textColor="#47082E"
                paddingBottom={2}
              />
              {sharedPlaces?.avoid?.map(item => (
                <View key={item?.place_id}>{renderPlaceItem({item})}</View>
              ))}
            </View>
          )}

          {sharedPlaces?.wishlist?.length > 0 && (
            <View>
              <AppText
                title="Bucket List:"
                textSize={2}
                textFontWeight
                textColor="#47082E"
                paddingBottom={2}
              />
              {sharedPlaces?.wishlist?.map(item => (
                <View key={item?.place_id}>{renderPlaceItem({item})}</View>
              ))}
            </View>
          )}

          {!loading && !hasData && (
            <View style={{marginTop: 50, alignItems: 'center'}}>
              <AppText title="No Shared Listing" textColor="#666" />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Main')}
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
              title={'Done'}
              textSize={1.8}
              textColor={AppColors.WHITE}
              textFontWeight
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  listContent: {paddingHorizontal: 20, paddingBottom: 120},
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  centerGray: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  actionButtons: {flexDirection: 'row', gap: 10},
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
    marginTop: 15,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
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

export default SharedList;
