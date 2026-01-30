import {View, Text, TouchableOpacity, ScrollView, Image} from 'react-native';
import React from 'react';
import AppColors from '../../../utils/AppColors';
import LineBreak from '../../../components/LineBreak';
import AppText from '../../../components/AppTextComps/AppText';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import AppImages from '../../../assets/images/AppImages';
import ImageIntroSlider from '../../../components/ImagesIntroSlider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
const ListViewDetail = ({route}) => {
  const {placeDetails} = route.params;

  return (
    <View style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <ScrollView style={{flex: 1}}>
        {placeDetails.photos?.length > 0 && (
          <ImageIntroSlider images={placeDetails.photos} />
        )}
        <LineBreak space={2} />

        <View style={{paddingHorizontal: 20}}>
          <AppText
            title={placeDetails?.restaurantName || 'No Name'}
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

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {/* <FlatList
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
              /> */}

              <View style={{gap: 20}}>
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <AppText
                      title={`${placeDetails?.rating}`}
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
                  {/* <AppText
                    title={`${MorePlaceDetails?.reviews.length} Reviews`}
                    textSize={1.5}
                    textColor={AppColors.BLACK}
                  /> */}
                </View>

                <View style={{gap: 5}}>
                  <AppText
                    title={placeDetails.actionType}
                    textSize={3.5}
                    textColor={AppColors.BLACK}
                  />
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <AppText
                      title={'Review: '}
                      textSize={2}
                      textColor={AppColors.GRAY}
                    />
                    <AppText
                      title={placeDetails.reviewText}
                      textSize={2}
                      textColor={AppColors.BLACK}
                    />
                  </View>
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
                title={placeDetails?.address || 'Address not found'}
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
        </View>
        <LineBreak space={2} />
      </ScrollView>
    </View>
  );
};

export default ListViewDetail;
