import React, {useEffect, useState, useMemo, useRef, Fragment} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';

import axios from 'axios';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import Sound from 'react-native-sound';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useDispatch, useSelector} from 'react-redux';

// Enable playback in silence mode
Sound.setCategory('Playback');

import ImageIntroSlider from '../../components/ImagesIntroSlider';
import AppColors from '../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import LineBreak from '../../components/LineBreak';
import AppText from '../../components/AppTextComps/AppText';
import AppImages from '../../assets/images/AppImages';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import RatingWithProgressbar from '../../components/RatingWithProgressbar';
import {
  baseUrl,
  Google_API_KEY,
  Google_Base_Url,
  Google_Places_Images,
} from '../../utils/api_content';
import {setPlaceDetail} from '../../redux/Slices';
import {
  AddReviews,
  GetReviews,
  updateReviews,
  GetReviewsByPlaceId,
} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {
  AddWishList,
  GetWishList,
  RemoveWishList,
} from '../../ApiCalls/Main/WishList_API/WishListAPI';
import {RemoveReview} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import ShowError from '../../utils/ShowError';
import ScreenWrapper from '../../components/ScreenWrapper';
import moment from 'moment';
import StarRating from 'react-native-star-rating-widget';

const HomeDetails = ({route}) => {
  const {placeDetails} = route.params;
  const token = useSelector(state => state.user.token);
  const userData = useSelector(state => state.user.userData);
  const dispatch = useDispatch();

  const [morePlaceDetails, setMoreInfoDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeReview, setTypeReview] = useState('');
  const [avoidLoader, setAvoidLoader] = useState(false);
  const [goAgainLoader, setGoAgainLoader] = useState(false);
  const [reviewLoader, setReviewLoader] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isWishList, setIsWishList] = useState(false);
  const [personalReviews, setPersonalReviews] = useState([]);
  const [wishlistLoader, setWishlistLoader] = useState(false);
  const [removeReviewLoader, setRemoveReviewLoader] = useState(false);
  const [rating, setRating] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoader, setUpdateLoader] = useState(false);
  const [inAppSummary, setInAppSummary] = useState(null);
  const [inAppBreakdown, setInAppBreakdown] = useState(null);

  // Sound refs with mounting guard
  const celebrationSound = useRef(null);
  const isSoundLoaded = useRef(false);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;

    // Pre-load the sound from Android resources
    celebrationSound.current = new Sound(
      'cloudcheering',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('failed to load the sound', error);
        } else {
          // Only mark as loaded if we haven't already unmounted
          if (isComponentMounted.current) {
            isSoundLoaded.current = true;
          }
        }
      },
    );

    return () => {
      isComponentMounted.current = false;
      const soundObj = celebrationSound.current;

      // Immediate cleanup of refs
      isSoundLoaded.current = false;
      celebrationSound.current = null;

      if (soundObj) {
        try {
          // CRITICAL: The Double.doubleValue() crash happens when _key is not a number.
          // We check typeof specifically to avoid passing null/undefined to the bridge.
          if (typeof soundObj._key === 'number' && soundObj._key !== -1) {
            if (typeof soundObj.release === 'function') {
              soundObj.release();
            }
          }
        } catch (e) {
          console.log('Final sound cleanup error:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    const soundObj = celebrationSound.current;
    const isLoaded = isSoundLoaded.current;

    if (showCelebration) {
      if (soundObj && isLoaded && typeof soundObj._key === 'number') {
        try {
          soundObj.setVolume(1.0).play(success => {
            if (!success) console.log('playback failed');
          });
        } catch (e) {
          console.log('Play crash prevented:', e);
        }
      }
    } else {
      // Small check to see if we are still mounted before stopping
      if (
        isComponentMounted.current &&
        soundObj &&
        isLoaded &&
        typeof soundObj._key === 'number'
      ) {
        try {
          soundObj.stop();
        } catch (e) {
          console.log('Stop crash prevented:', e);
        }
      }
    }
  }, [showCelebration]);

  useEffect(() => {
    const id = placeDetails?.placeId || placeDetails?.place_id;
    console.log('HomeDetails initializing with ID:', id);
    if (id) {
      getMorePlaceInfo(id);
      syncUserStatus(id);
    } else {
      setLoading(false);
    }
  }, [placeDetails, token]);

  const syncUserStatus = async id => {
    try {
      const [wishRes, revRes, inAppRes] = await Promise.all([
        GetWishList(token),
        GetReviews(token),
        GetReviewsByPlaceId(token, id),
      ]);
      console.log('wishRes:-', wishRes);
      // Sync Wishlist
      const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
      if (wishlistData && Array.isArray(wishlistData)) {
        setIsWishList(wishlistData.some(item => item.placeId === id));
      }

      // Sync Personal Reviews
      if (revRes?.reviews && Array.isArray(revRes.reviews)) {
        const matching = revRes.reviews
          .filter(r => r.placeId === id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPersonalReviews(matching);
      }

      // Sync In-App Ratings Summary
      if (inAppRes?.data) {
        setInAppSummary(inAppRes.data.summary || null);
        setInAppBreakdown(inAppRes.data.ratingBreakdown || null);
      }
    } catch (error) {
      console.log('Error syncing user status:', error);
    }
  };

  const getMorePlaceInfo = async id => {
    try {
      setLoading(true);
      const url = `${Google_Base_Url}place/details/json?place_id=${id}&key=${Google_API_KEY}`;

      const response = await axios.get(url);

      if (response.data?.result) {
        setMoreInfoDetail(response.data.result);
        dispatch(setPlaceDetail(response.data.result));
      } else {
        ShowError('Could not fetch extra details.', 2000);
      }
    } catch (error) {
      console.error('getMorePlaceInfo Error:', error);
      ShowError('Network error. Please try again.', 2000);
    } finally {
      setLoading(false);
    }
  };

  // Memoized image extraction to prevent recalculation on every render
  const images = useMemo(() => {
    const photos = morePlaceDetails?.photos || placeDetails?.photos;
    if (!photos || !Array.isArray(photos)) return [];

    return photos
      .map(photo => {
        if (typeof photo === 'string') return photo;
        if (photo?.photo_reference)
          return `${Google_Places_Images}${photo.photo_reference}`;
        return null;
      })
      .filter(Boolean);
  }, [morePlaceDetails, placeDetails]);

  // Compute breakdown from In-App reviews
  const ratingData = useMemo(() => {
    const breakdown = inAppBreakdown || {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    const total = inAppSummary?.totalReviews || 0;

    return Object.keys(breakdown)
      .map(star => ({
        id: star,
        rating: Number(star),
        progress: total > 0 ? Math.round((breakdown[star] / total) * 100) : 0,
      }))
      .reverse();
  }, [inAppBreakdown, inAppSummary]);

  const recommendationPercentage = inAppSummary?.recommendationPercentage || 0;
  const averageRating = inAppSummary?.averageRating
    ? Number(inAppSummary.averageRating).toFixed(1)
    : '0';
  const totalReviews = inAppSummary?.totalReviews || 0;

  const getCategory = () => {
    const types = morePlaceDetails?.types || placeDetails?.types || [];
    if (types.length === 0) return 'Place';
    const filterTypes = [
      'point_of_interest',
      'establishment',
      'food',
      'natural_feature',
      'street_address',
      'route',
    ];
    const meaningfulType =
      types.find(t => !filterTypes.includes(t)) || types[0];
    return meaningfulType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const createReview = async type => {
    if (!morePlaceDetails) {
      ShowError('Please wait, details are loading...', 2000);
      return;
    }

    if (rating === 0) {
      ShowError('Please select rating', 2000);
      return;
    }

    if (type === 'Avoid') setAvoidLoader(true);
    if (type === 'Go Again') setGoAgainLoader(true);
    if (type === 'Review') setReviewLoader(true);

    // If item is in wishlist, remove it first
    if (isWishList) {
      try {
        const placeId = placeDetails?.placeId;
        const res = await RemoveWishList(token, {placeId});
        if (res?.success) {
          setIsWishList(false);
        }
      } catch (error) {
        console.log('Error removing from wishlist before review:', error);
      }
    }

    const data = {
      placeId: morePlaceDetails?.place_id,
      restaurantName: morePlaceDetails?.name,
      address: morePlaceDetails?.formatted_address,
      rating: rating,
      reviewText: typeReview,
      actionType: type,
      photos: images,
      category: getCategory(),
      latitude: morePlaceDetails?.geometry?.location?.lat,
      longitude: morePlaceDetails?.geometry?.location?.lng,
    };
    // console.log('review payload:-', JSON.stringify(data, null, 2));

    try {
      const res = await AddReviews(token, data);
      console.log('res in createReview:-', res);
      if (res.success) {
        if (type === 'Go Again') {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
        setTypeReview('');
        // Sync status to show the new review immediately
        syncUserStatus(morePlaceDetails?.place_id);
      }
      if (!(res.success && type === 'Go Again')) {
        ShowError(res.msg || 'Review processed', 2000);
      }
    } catch (err) {
      ShowError('Failed to add review', 2000);
    } finally {
      setAvoidLoader(false);
      setGoAgainLoader(false);
      setReviewLoader(false);
    }
  };

  const handleRemoveReview = async () => {
    if (personalReviews.length === 0) return;

    const reviewId = personalReviews[0]._id || personalReviews[0].id;
    if (!reviewId) {
      ShowError('Review ID not found', 2000);
      return;
    }

    setRemoveReviewLoader(true);
    try {
      const res = await RemoveReview({reviewId}, token);
      if (res?.success) {
        ShowError(res.msg || 'Review removed successfully', 2000);
        const id = placeDetails?.placeId;
        syncUserStatus(id);
      } else {
        ShowError(res?.message || 'Failed to remove review', 2000);
      }
    } catch (error) {
      console.log('Error removing review:', error);
      ShowError('Something went wrong', 2000);
    } finally {
      setRemoveReviewLoader(false);
    }
  };

  const handleEditPress = () => {
    if (personalReviews.length > 0) {
      const review = personalReviews[0];
      setRating(review.rating || 0);
      setTypeReview(review.reviewText || '');
      setIsEditing(true);
    }
  };

  const handleUpdateReview = async () => {
    if (rating === 0) {
      ShowError('Please select rating', 2000);
      return;
    }

    const reviewId = personalReviews[0]._id || personalReviews[0].id;
    if (!reviewId) {
      ShowError('Review ID not found', 2000);
      return;
    }

    setUpdateLoader(true);
    const data = {
      reviewId,
      rating,
      reviewText: typeReview,
      actionType: personalReviews[0].actionType,
      placeId: morePlaceDetails?.place_id,
      restaurantName: morePlaceDetails?.name,
      address: morePlaceDetails?.formatted_address,
      photos: images,
      category: getCategory(),
      latitude: morePlaceDetails?.geometry?.location?.lat,
      longitude: morePlaceDetails?.geometry?.location?.lng,
    };

    try {
      const res = await updateReviews(token, data);
      if (res?.success) {
        ShowError(res.msg || 'Review updated successfully', 2000);
        setIsEditing(false);
        setTypeReview('');
        setRating(0);
        const id = placeDetails?.placeId;
        syncUserStatus(id);
      } else {
        ShowError(res?.message || 'Failed to update review', 2000);
      }
    } catch (error) {
      console.log('Error updating review:', error);
      ShowError('Something went wrong', 2000);
    } finally {
      setUpdateLoader(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTypeReview('');
    setRating(0);
  };

  const toggleWishlist = async () => {
    if (!morePlaceDetails && !placeDetails) return;

    setWishlistLoader(true);
    const placeId = placeDetails?.placeId || placeDetails?.place_id;

    try {
      if (isWishList) {
        console.log('Removing from wishlist:', placeId);
        const res = await RemoveWishList(token, {placeId});
        console.log('RemoveWishList response in HomeDetails:', res);
        if (res?.success) {
          setIsWishList(false);
          ShowError(res?.msg || 'Removed from wishlist', 2000);
        } else {
          ShowError(res?.message || 'Failed to remove from wishlist', 2000);
        }
      } else {
        const data = {
          placeId: placeId,
          name: morePlaceDetails?.name || placeDetails?.name,
          address: morePlaceDetails?.formatted_address || placeDetails?.address,
          image: morePlaceDetails?.photos?.[0]?.photo_reference || '',
          rating: morePlaceDetails?.rating || placeDetails?.rating,
          userRatingsTotal:
            morePlaceDetails?.user_ratings_total ||
            placeDetails?.user_ratings_total ||
            0,
          category: getCategory(),
          latitude:
            morePlaceDetails?.geometry?.location?.lat ||
            placeDetails?.geometry?.location?.lat,
          longitude:
            morePlaceDetails?.geometry?.location?.lng ||
            placeDetails?.geometry?.location?.lng,
          notes: '',
          isVisited: false,
        };
        console.log('Wishlist Payload:-', JSON.stringify(data, null, 2));
        const res = await AddWishList(token, data);
        console.log('AddWishList response in HomeDetails:-', res);
        if (res?.success) {
          setIsWishList(true);
          ShowError(res?.msg || 'Added to wishlist', 2000);
        } else {
          ShowError(res?.message || 'Failed to add to wishlist', 2000);
        }
      }
    } catch (error) {
      console.log('Wishlist toggle error:', error);
      ShowError('Something went wrong', 2000);
    } finally {
      setWishlistLoader(false);
    }
  };

  const handleOpenMap = () => {
    const lat =
      morePlaceDetails?.geometry?.location?.lat ||
      placeDetails?.geometry?.location?.lat;
    const lng =
      morePlaceDetails?.geometry?.location?.lng ||
      placeDetails?.geometry?.location?.lng;
    const label = morePlaceDetails?.name || placeDetails?.name || 'Location';

    if (!lat || !lng) {
      ShowError('Location coordinates not available', 2000);
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback to web link if maps app isn't installed
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(webUrl);
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.BLACK} />
      </View>
    );
  }

  // console.log('personalReview:-', personalReview);
  // console.log('placeId:-', placeDetails?.placeId);
  console.log('placeDetails:-', placeDetails);
  // console.log('ratingData:-', ratingData);
  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {images.length > 0 && <ImageIntroSlider images={images} />}

        <LineBreak space={2} />

        <View style={styles.contentPadding}>
          <View style={styles.titleRow}>
            <View style={{width: responsiveWidth(90)}}>
              <AppText
                title={
                  morePlaceDetails?.name || placeDetails?.name || 'No Name'
                }
                textColor={AppColors.BLACK}
                textSize={3}
                textFontWeight
              />
            </View>

            {/* <TouchableOpacity
              style={styles.wishlistBtn}
              onPress={toggleWishlist}
              disabled={wishlistLoader}>
              {wishlistLoader ? (
                <ActivityIndicator size="small" color={AppColors.BTNCOLOURS} />
              ) : (
                <FontAwesome
                  name={isWishList ? 'bookmark' : 'bookmark-o'}
                  size={24}
                  color={AppColors.BTNCOLOURS}
                />
              )}
            </TouchableOpacity> */}
          </View>

          <LineBreak space={2} />

          {/* Ratings Section */}
          <View style={styles.sectionBorder}>
            <AppText
              title="Reviews & Ratings"
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />
            <LineBreak space={1} />

            <View style={styles.rowAlignCenter}>
              <FlatList
                data={ratingData}
                scrollEnabled={false}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={<LineBreak space={2} />}
                renderItem={({item}) => (
                  <View style={styles.ratingRow}>
                    <View style={styles.starLabel}>
                      <AppText
                        title={item.rating}
                        textSize={1.8}
                        textColor={AppColors.BTNCOLOURS}
                      />
                      <Entypo
                        name="star"
                        size={responsiveFontSize(2)}
                        color={AppColors.BTNCOLOURS}
                      />
                    </View>
                    <RatingWithProgressbar
                      progress={item.progress}
                      animated
                      style={{width: '70%'}}
                    />
                  </View>
                )}
              />

              <View style={{gap: 20, marginLeft: 10}}>
                <View>
                  <View style={styles.compactRow}>
                    <AppText
                      title={`${averageRating}`}
                      textSize={4}
                      textColor={AppColors.BLACK}
                      textFontWeight
                    />
                    <AntDesign name="star" size={24} color={AppColors.Yellow} />
                  </View>
                  <AppText
                    title={`${totalReviews} Reviews`}
                    textSize={1.5}
                    textColor={AppColors.BLACK}
                  />
                </View>

                <View>
                  <AppText
                    title={`${recommendationPercentage}%`}
                    textSize={3.5}
                    textColor={AppColors.BLACK}
                  />
                  <AppText
                    title="Recommended"
                    textSize={1.5}
                    textColor={AppColors.BLACK}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.sectionBorder}>
            <AppText
              title="Location"
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />
            <LineBreak space={2} />
            <View style={styles.compactRow}>
              <Ionicons
                name="location"
                size={responsiveFontSize(1.8)}
                color={AppColors.BTNCOLOURS}
              />
              <AppText
                title={
                  morePlaceDetails?.formatted_address ||
                  placeDetails?.address ||
                  'Address not found'
                }
                textColor={AppColors.BLACK}
                textSize={1.8}
              />
            </View>
            <LineBreak space={2} />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenMap}
              style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                region={{
                  latitude: morePlaceDetails?.geometry?.location?.lat || 0,
                  longitude: morePlaceDetails?.geometry?.location?.lng || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}>
                <Marker
                  coordinate={{
                    latitude: morePlaceDetails?.geometry?.location?.lat || 0,
                    longitude: morePlaceDetails?.geometry?.location?.lng || 0,
                  }}
                  title={morePlaceDetails?.name || 'Location'}>
                  <Image
                    source={AppImages.LOCATION_MARK}
                    style={{height: 40, width: 40}}
                  />
                </Marker>
              </MapView>
            </TouchableOpacity>
          </View>

          {/* Individual Reviews List */}
          {personalReviews.length > 0 && (
            <View style={styles.sectionBorder}>
              <AppText
                title={'Your Review'}
                textColor={AppColors.BLACK}
                textSize={2}
                textFontWeight
              />
              <LineBreak space={2} />

              {personalReviews.length > 0
                ? personalReviews.map((review, index) => (
                    <View key={index}>
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <FastImage
                            source={
                              userData?.profileImage
                                ? {uri: `${baseUrl}/${userData.profileImage}`}
                                : AppImages.USER_PLACEHOLDER
                            }
                            style={styles.authorPhoto}
                          />
                          <View style={{flex: 1}}>
                            <View
                              style={[
                                styles.rowAlignCenter,
                                {justifyContent: 'space-between'},
                              ]}>
                              <AppText
                                title={userData?.fullName || 'You'}
                                textColor={AppColors.BLACK}
                                textSize={1.6}
                                textFontWeight
                              />
                            </View>
                            <AppText
                              title={review.actionType}
                              textColor={
                                review.actionType === 'Avoid'
                                  ? AppColors.avoid
                                  : AppColors.goAgain
                              }
                              textSize={1.3}
                              textFontWeight
                              paddingBottom={0.5}
                            />

                            <StarRating
                              rating={review.rating}
                              onChange={() => {}}
                              starSize={20}
                              color={AppColors.BTNCOLOURS}
                              emptyColor={AppColors.GRAY}
                              starContainerStyle={{marginLeft: -8}}
                            />
                          </View>

                          <View style={styles.timeContainer}>
                            <AppText
                              title={moment(review.createdAt).fromNow()}
                              textColor={AppColors.GRAY}
                              textSize={1.2}
                              paddingLeft={2}
                            />
                          </View>
                        </View>

                        <LineBreak space={1.5} />
                        <AppText
                          title={review.reviewText || 'No comment provided'}
                          textColor={AppColors.BLACK}
                          textSize={1.5}
                          lineHeight={2}
                        />

                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={handleEditPress}>
                          <AntDesign
                            name="edit"
                            size={12}
                            color={AppColors.WHITE}
                          />
                        </TouchableOpacity>
                      </View>
                      <LineBreak space={2} />
                    </View>
                  ))
                : null}
            </View>
          )}

          {/* Review Input & Action Buttons */}
          {(personalReviews.length === 0 || isEditing) && (
            <View
              style={{
                paddingVertical: responsiveHeight(2),
                paddingHorizontal: responsiveWidth(2),
                borderRadius: 12,
                backgroundColor: AppColors.whiteOpacity,
                marginTop: 10,
              }}>
              <AppText
                title={isEditing ? 'Update Review' : 'Add Review'}
                textColor={AppColors.BLACK}
                textSize={2}
                textFontWeight
              />
              <LineBreak space={1} />

              {/* Star Rating */}
              <View style={styles.starContainner}>
                <StarRating
                  rating={rating}
                  onChange={setRating}
                  starSize={25}
                  color={AppColors.BTNCOLOURS}
                  emptyColor={AppColors.GRAY}
                />
              </View>

              <AppTextInput
                placeholder="Write your detailed review"
                textAlignVertical="top"
                inputHeight={15}
                multiline
                value={typeReview}
                onChangeText={setTypeReview}
              />
              <LineBreak space={2} />
              <View style={styles.buttonRow}>
                {isEditing ? (
                  <Fragment>
                    <AppButton
                      title="Cancel"
                      handlePress={handleCancelEdit}
                      btnWidth={42}
                      btnBackgroundColor={AppColors.GRAY}
                    />
                    <AppButton
                      title="Update"
                      handlePress={handleUpdateReview}
                      btnWidth={42}
                      btnBackgroundColor={AppColors.BTNCOLOURS}
                      loading={updateLoader}
                    />
                  </Fragment>
                ) : (
                  <Fragment>
                    <AppButton
                      title="Avoid"
                      handlePress={() => createReview('Avoid')}
                      btnWidth={42}
                      btnBackgroundColor={AppColors.avoid}
                      loading={avoidLoader}
                    />
                    <AppButton
                      title="Go Again"
                      handlePress={() => createReview('Go Again')}
                      btnWidth={42}
                      btnBackgroundColor={AppColors.goAgain}
                      loading={goAgainLoader}
                    />
                  </Fragment>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons (Remaining) */}
          <Fragment>
            {personalReviews.length > 0 && !isWishList && !isEditing && (
              <AppButton
                title="Remove Review"
                handlePress={handleRemoveReview}
                btnWidth={92}
                btnBackgroundColor={AppColors.avoid}
                loading={removeReviewLoader}
                mT={10}
              />
            )}

            {personalReviews.length === 0 && (
              <AppButton
                title={isWishList ? 'Remove from Wishlist' : 'Add to Wishlist'}
                handlePress={toggleWishlist}
                btnWidth={92}
                btnBackgroundColor={AppColors.wishlist}
                loading={wishlistLoader}
                mT={10}
              />
            )}
          </Fragment>
        </View>
        <LineBreak space={4} />
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        isVisible={showCelebration}
        // animationIn="zoomIn"
        // animationOut="zoomOut"
        backdropOpacity={0.2}
        style={{margin: 0}}>
        <View style={styles.gifContainer}>
          <FastImage
            source={require('../../assets/gif/celebration.gif')}
            style={{height: '100%', width: '100%'}}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  contentPadding: {paddingHorizontal: 20},
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.appBgColor,
    paddingVertical: responsiveHeight(2),
  },
  rowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  starLabel: {
    flexDirection: 'row',
    gap: responsiveWidth(0.5),
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: responsiveHeight(25),
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {width: responsiveWidth(90)},

  inputAction: {
    flex: 1,
    height: responsiveHeight(12),
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContent: {
    // backgroundColor: AppColors.WHITE,
    // borderRadius: 20,
    // paddingTop: 20,
    // paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wishlistBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.WHITE,
    height: 40,
    width: 40,
    borderRadius: 30,
  },
  gifContainer: {
    height: responsiveHeight(48),
    width: responsiveWidth(100),
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  reviewItem: {
    paddingVertical: 15,
  },
  reviewSeparator: {
    borderBottomWidth: 0.5,
    borderBottomColor: AppColors.LIGHTGRAY,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
    // alignItems: 'center',
    // backgroundColor: 'teal',
  },
  authorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.LIGHTGRAY,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  timeContainer: {
    padding: 4,
    borderRadius: 10,
  },
  starContainner: {
    width: '100%',
    gap: 10,
    marginBottom: 10,
    // backgroundColor: 'red',
  },
  editButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: AppColors.BTNCOLOURS,
    padding: 8,
    borderRadius: 30,
  },
});

export default HomeDetails;
