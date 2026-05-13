/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, TouchableOpacity, ImageBackground} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AppColors from '../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import AppText from './AppTextComps/AppText';
import {Google_Places_Images} from '../utils/api_content';
import AppImages from '../assets/images/AppImages';

type cardProps = {
  name?: string;
  address?: string;
  CardImg?: any;
  cardOnPress?: any;
  cardHeight?: any;
  cardWidth?: any;
  category?: string;
};

const HomeCard = ({
  name,
  address,
  CardImg,
  cardOnPress,
  cardHeight,
  cardWidth,
  category = 'Restaurant',
}: cardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={cardOnPress}
      style={{
        height: cardHeight
          ? responsiveHeight(cardHeight)
          : responsiveHeight(27),
        width: cardWidth ? responsiveWidth(cardWidth) : responsiveWidth(43),
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: responsiveHeight(1),
        backgroundColor: AppColors.menuBg,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}>
      <ImageBackground
        source={{uri: `${Google_Places_Images}${CardImg}`}}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
        resizeMode="cover">
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)', // "rgba(146, 77, 191, 0.6)"
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(1),
          }}>
          <AppText
            title={name}
            textColor={AppColors.WHITE}
            textSize={1.8}
            textFontWeight
            numberOfLines={1}
          />

          <View
            style={{
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              marginTop: 2,
            }}>
            <MaterialIcons
              name={'category'}
              size={responsiveFontSize(1.8)}
              color={AppColors.WHITE}
            />
            <AppText
              title={category}
              textColor={AppColors.WHITE}
              textSize={1.2}
              numberOfLines={1}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              marginTop: 2,
            }}>
            <Entypo
              name={'location-pin'}
              size={responsiveFontSize(1.8)}
              color={AppColors.WHITE}
            />
            <AppText
              title={address}
              textColor={AppColors.WHITE}
              textSize={1.2}
              numberOfLines={1}
            />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default HomeCard;
