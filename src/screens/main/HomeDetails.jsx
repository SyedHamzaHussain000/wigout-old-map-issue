/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import ImageIntroSlider from '../../components/ImagesIntroSlider';
import AppColors from '../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import LineBreak from '../../components/LineBreak';
import AppText from '../../components/AppTextComps/AppText';
import SeeMoreText from '../../components/SeeMoreText';
import AppImages from '../../assets/images/AppImages';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import axios from 'axios';
import {
  Google_API_KEY,
  Google_Base_Url,
  Google_Places_Images,
} from '../../utils/api_content';
import RatingWithProgressbar from '../../components/RatingWithProgressbar';
import Entypo from 'react-native-vector-icons/Entypo';
import {useDispatch, useSelector} from 'react-redux';
import {setPlaceDetail} from '../../redux/Slices';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {AddReviews} from '../../ApiCalls/Main/Reviews/ReviewsApiCall';
import ShowError from '../../utils/ShowError';
import FastImage from 'react-native-fast-image';
// import { Google_API_KEY } from '@env';
import Modal from 'react-native-modal';

const HomeDetails = ({route}) => {
  const {placeDetails} = route.params;
  // console.log("Google_API_KEY",process.env.Google_API_KEY)
  // const MorePlaceDetails = useSelector(state => state.user.Save_Place_Detail);
  const token = useSelector(state => state.user.token);
  const dispatch = useDispatch();

  const [MorePlaceDetails, setMoreInfoDetail] = useState();
  const [loading, setLoading] = useState(false);

  const [typeReview, setTypeReview] = useState('');
  const [buttonLoader, setButtonLoader] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);



  useEffect(() => {
    if (placeDetails?.place_id) {
      getMorePlaceInfo();
    }
  }, [placeDetails]);

  const getMorePlaceInfo = () => {
    try {
      setLoading(true);
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${Google_Base_Url}place/details/json?place_id=${placeDetails?.place_id}&key=${Google_API_KEY}`,
        headers: {},
      };

      axios
        .request(config)
        .then(response => {
          // console.log(JSON.stringify(response.data));/
          setMoreInfoDetail(response.data.result);
          dispatch(setPlaceDetail(response.data.result));
          setLoading(false);
        })
        .catch(error => {
          console.log(error);
          setLoading(false);
        });
    } catch (error) {
      console.log('error', error);
      setLoading(false);
    }
  };

  // Compute breakdown from reviews
  const getRatingBreakdown = () => {
    const breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    const totalReviews = MorePlaceDetails?.reviews?.length || 0;

    if (totalReviews === 0) return [];

    MorePlaceDetails.reviews.forEach(r => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    });

    // Convert to percentage for progress bars
    return Object.keys(breakdown)
      .map(star => ({
        id: star,
        rating: Number(star),
        progress: Math.round((breakdown[star] / totalReviews) * 100),
      }))
      .reverse(); // reverse to show 5→1 order
  };

  if (loading) {
    return <ActivityIndicator size={'large'} color={AppColors.BLACK} />;
  }
  // console.log("images",images)
  // return;
  const extractImageUrls = () => {
    if (MorePlaceDetails?.photos) {
      return MorePlaceDetails?.photos?.map(photo => {
        return `${Google_Places_Images}${photo?.photo_reference}`;
      });
    }
    return [];
  };

  const ratingData = getRatingBreakdown();
  const recommendationPercentage = Math.round(
    ((MorePlaceDetails?.rating || 0) / 5) * 100,
  );

  // const ratingData = [
  //   { id: 1, rating: 1, progress: 42 },
  //   { id: 2, rating: 2, progress: 65 },
  //   { id: 3, rating: 3, progress: 15 },
  //   { id: 4, rating: 4, progress: 22 },
  //   { id: 5, rating: 5, progress: 8 },
  // ];

  // Only render ImageIntroSlider if we have images
  const images = extractImageUrls();

  const CeateReview = async type => {
    setButtonLoader(true);
    const data = {
      placeId: MorePlaceDetails?.place_id,
      restaurantName: MorePlaceDetails?.name,
      address: MorePlaceDetails?.formatted_address,
      rating: MorePlaceDetails?.rating,
      reviewText: typeReview,
      actionType: type,
      photos: images,
      coordinates: {
        latitude: MorePlaceDetails?.geometry?.location?.lat,
        longitude: MorePlaceDetails?.geometry?.location?.lng,
      },
    };

    const _addReview = await AddReviews(token, data);
    if(_addReview.success == true)
    {
      if(type == "Go Again")
      {

      
        setShowCelebration(true)
        
        setTimeout(() => {
          setShowCelebration(false)
        }, 2000);
      }
    }
      console.log(_addReview)
    setTypeReview('');
    setButtonLoader(false);
    ShowError(_addReview.message, 2000);

    console.log('_addReview', _addReview);
  };
  return (
    <View style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <ScrollView style={{flex: 1}}>
        {images?.length > 0 && <ImageIntroSlider images={images} />}
        <LineBreak space={2} />

        <View style={{paddingHorizontal: 20}}>
          <AppText
            title={MorePlaceDetails?.name || 'No Name'}
            textColor={AppColors.BLACK}
            textSize={3}
            textFontWeight
          />
          <LineBreak space={2} />

          {/* <View
            style={{
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderBottomColor: AppColors.appBgColor,
              borderTopColor: AppColors.appBgColor,
              paddingVertical: responsiveHeight(2),
            }}>
            <AppText
              title={'About Event'}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />

            <LineBreak space={1} />

            <SeeMoreText
              text={
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut...'
              }
              textColor={AppColors.GRAY}
              textSize={1.5}
              lineHeight={2.3}
            />
          </View> */}

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: AppColors.appBgColor,
              paddingVertical: responsiveHeight(2),
            }}>
            <AppText
              title={'Reviews & Ratings'}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />

            <LineBreak space={1} />

            {/* <Image source={AppImages.chart} /> */}

            <Modal isVisible={showCelebration}>
              <View
                style={{
                  backgroundColor: AppColors.WHITE,
                  borderRadius: 20,
                  paddingTop: 10,
                  gap: 10,
                }}>
                <AppText
                  title={'Go Again'}
                  textSize={3}
                  textAlignment={'center'}
                />
                <FastImage
                  source={require('../../assets/gif/celebrate.gif')}
                  style={{height: 200}}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
            </Modal>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <FlatList
                data={ratingData}
                ItemSeparatorComponent={<LineBreak space={2} />}
                renderItem={({item}) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: responsiveWidth(0.5),
                        alignItems: 'center',
                      }}>
                      <AppText
                        title={item.rating}
                        textSize={1.8}
                        textColor={AppColors.ThemeColor}
                      />
                      <Entypo
                        name="star"
                        size={responsiveFontSize(2)}
                        color={AppColors.ThemeColor}
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

              <View style={{gap: 20}}>
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <AppText
                      title={`${MorePlaceDetails?.rating}`}
                      textSize={4}
                      textColor={AppColors.BLACK}
                      textFontWeight
                    />
                    <AntDesign
                      name={'star'}
                      size={24}
                      color={AppColors.Yellow}
                    />
                  </View>
                  <AppText
                    title={`${MorePlaceDetails?.reviews.length} Reviews`}
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
                    title={'Recommended'}
                    textSize={1.5}
                    textColor={AppColors.BLACK}
                  />
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: AppColors.appBgColor,
              paddingVertical: responsiveHeight(2),
            }}>
            <AppText
              title={'Location'}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />

            <LineBreak space={2} />

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
              <Ionicons
                name={'location'}
                size={responsiveFontSize(1.8)}
                color={AppColors.BTNCOLOURS}
              />
              <AppText
                title={
                  MorePlaceDetails?.formatted_address || 'Address not found'
                }
                textColor={AppColors.GRAY}
                textSize={1.8}
              />
            </View>

            <LineBreak space={2} />

            <TouchableOpacity onPress={() => {}}>
              <Image
                source={AppImages.USER_LOCATION}
                style={{width: responsiveWidth(90)}}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingVertical: responsiveHeight(2),
            }}>
            <AppText
              title={'Add Review'}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />

            <LineBreak space={2} />

            <AppTextInput
              inputPlaceHolder={'Write your detailed review'}
              borderWidth={1}
              borderColor={AppColors.GRAY}
              textAlignVertical={'top'}
              inputHeight={15}
              multiline={true}
              onChangeText={txt => setTypeReview(txt)}
              value={typeReview}
              rightIcon={
                <View
                  style={{
                    flex: 1,
                    height: responsiveHeight(12),
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                  }}>
                  <TouchableOpacity>
                    <Ionicons
                      name={'send'}
                      size={responsiveFontSize(2.5)}
                      color={AppColors.BTNCOLOURS}
                    />
                  </TouchableOpacity>
                </View>
              }
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <AppButton
              title={'Avoid'}
              handlePress={() => CeateReview('Avoid')}
              textFontWeight={false}
              btnPadding={15}
              btnWidth={44}
              textSize={2}
              btnBackgroundColor={AppColors.LIGHT_BTNCOLOURS}
              loading={buttonLoader}
            />
            <AppButton
              title={'Go Again'}
              handlePress={() => CeateReview('Go Again')}
              textFontWeight={false}
              btnPadding={15}
              btnWidth={44}
              textSize={2}
              btnBackgroundColor={AppColors.BTNCOLOURS}
              loading={buttonLoader}
            />
          </View>
        </View>
        <LineBreak space={2} />
      </ScrollView>
    </View>
  );
};

export default HomeDetails;
