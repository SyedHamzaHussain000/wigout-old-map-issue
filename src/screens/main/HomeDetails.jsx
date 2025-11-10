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
import {Google_API_KEY, Google_Base_Url, Google_Places_Images} from '../../utils/api_content';

const HomeDetails = ({route}) => {
  const {placeDetails} = route.params;



  const [MorePlaceDetails, setMoreInfoDetail] = useState();
    const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (placeDetails?.place_id) {
      getMorePlaceInfo();
    }
  }, [placeDetails]);

  

  const getMorePlaceInfo = () => {
    try {
      setLoading(true)
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${Google_Base_Url}place/details/json?place_id=${placeDetails?.place_id}&fields=name,rating,formatted_address,formatted_phone_number,website,photos&key=${Google_API_KEY}`,
        headers: {},
      };

      axios
        .request(config)
        .then(response => {
          // console.log(JSON.stringify(response.data));/
          setMoreInfoDetail(response.data.result);
          setLoading(false)
        })
        .catch(error => {
          console.log(error);
          setLoading(false)
        });
    } catch (error) {
      console.log('error', error);
      setLoading(false)
    }
  };

  if(loading){
    return (
      <ActivityIndicator size={'large'} color={AppColors.BLACK}/>
    )
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

// Only render ImageIntroSlider if we have images
const images = extractImageUrls();
  return (
    <View style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      {images?.length > 0 && <ImageIntroSlider images={images} />}

      <ScrollView style={{flex: 1, paddingHorizontal: responsiveWidth(5)}}>
        <LineBreak space={2} />

        <View>
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

            <Image source={AppImages.chart} />
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
              handlePress={() => {}}
              textFontWeight={false}
              btnPadding={15}
              btnWidth={44}
              textSize={2}
              btnBackgroundColor={AppColors.LIGHT_BTNCOLOURS}
            />
            <AppButton
              title={'Go Again'}
              handlePress={() => {}}
              textFontWeight={false}
              btnPadding={15}
              btnWidth={44}
              textSize={2}
              btnBackgroundColor={AppColors.BTNCOLOURS}
            />
          </View>
        </View>
        <LineBreak space={2} />
      </ScrollView>
    </View>
  );
};

export default HomeDetails;
