/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Image, TouchableOpacity} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LineBreak from './LineBreak';
import AppColors from '../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import AppText from './AppTextComps/AppText';
import SVGXml from './SVGXML';
import {AppIcons} from '../assets/icons';
import AppButton from './AppButton';
import { Google_Places_Images } from '../utils/api_content';

type cardProps = {
  item?: any;
  name?: string;
  address?:string;
  CardImg?: any;
  cardWidth?: any;
  cardContainerWidth?: any;
  titleFontSize?: any;
  dateFontSize: any;
  locationFontSize: any;
  containerPaddingHorizontal: any;
  textContainerPaddingHorizontal: any;
  containerPaddingVertical?: any;
  containerFlexDirection?: any;
  containerAlignItems?: any;
  containerborderRadius?: any;
  bottomPadding?: any;
  dateNumOfLines?: any;
  dateMaxWidth?: any;
  locationNumOfLines?: any;
  locationMaxWidth?: any;
  titleMaxWidth?: any;
  titleNumOfLines?: any;
  containerGap?: any;
  cardOnPress?: any;
  isShowFavIcon?: any;
  heartOnPress?: any;
  numOfTickets?: any;
  badgeShown?: any;
  cancelBookingAndLeaveReviewOnPress?: any;
  viewETicketOnPress?: any;
  isHeartIconMoveToEnd?: any;
  badgeWidth?:any;
  badgeHeight?:any;
  cardContainerBackgroundColor?:any;
};

const RecommendedCard = ({
  item,
  name,
  address,
  CardImg,
  cardContainerWidth,
  textContainerPaddingHorizontal,
  containerPaddingHorizontal,
  cardWidth,
  titleFontSize,
  dateFontSize,
  locationFontSize,
  containerPaddingVertical,
  containerborderRadius,
  bottomPadding,
  dateNumOfLines,
  dateMaxWidth,
  locationNumOfLines,
  locationMaxWidth,
  titleMaxWidth,
  titleNumOfLines,
  containerFlexDirection,
  containerAlignItems,
  containerGap,
  cardOnPress,
  isShowFavIcon,
  heartOnPress,
  numOfTickets,
  badgeShown,
  cancelBookingAndLeaveReviewOnPress,
  viewETicketOnPress,
  isHeartIconMoveToEnd,
  badgeWidth,
  badgeHeight,
  cardContainerBackgroundColor,
}: cardProps) => {
  return (
    <>
      <TouchableOpacity
        onPress={cardOnPress}
        style={{
          borderWidth: cardContainerBackgroundColor ? 0 : 1,
          borderColor: AppColors.LIGHTGRAY,
          elevation: 5,
          backgroundColor: AppColors.WHITE,
          borderRadius: containerborderRadius ? containerborderRadius : 40,
          width: cardContainerWidth
            ? responsiveWidth(cardContainerWidth)
            : 'auto',
        }}>
        <View
          style={{
            flexDirection: containerFlexDirection
              ? containerFlexDirection
              : 'column',
            alignItems: containerAlignItems
              ? containerAlignItems
              : 'flex-start',
            gap: containerGap ? containerGap : 0,
            paddingVertical: containerPaddingVertical
              ? responsiveHeight(containerPaddingVertical)
              : responsiveHeight(2),
            paddingHorizontal: containerPaddingHorizontal
              ? responsiveWidth(containerPaddingHorizontal)
              : responsiveWidth(4),
          }}>
          <Image
            source={{uri: `${Google_Places_Images}${CardImg}`}}
            style={{
              alignSelf: 'center',
              width: cardWidth
                ? responsiveHeight(cardWidth)
                : responsiveWidth(70),
              borderRadius: containerborderRadius ? containerborderRadius : 32,
              height: cardWidth
                ? responsiveHeight(cardWidth)
                : responsiveHeight(27),
            }}
          />

          <LineBreak space={1} />

          {numOfTickets && (
            <View
              style={{
                paddingHorizontal: textContainerPaddingHorizontal
                  ? responsiveWidth(textContainerPaddingHorizontal)
                  : responsiveWidth(3),
                flexDirection: 'row',
                gap: 40,
                width: responsiveWidth(cardContainerWidth - 3),
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <AppText
                title={`${numOfTickets} Tickets`}
                textColor={AppColors.BTNCOLOURS}
                textSize={1.3}
              />
              {badgeShown && (
                <SVGXml icon={AppIcons.badge} width={badgeWidth ? badgeWidth : '20'} height={badgeHeight ? badgeHeight : '20'} />
              )}
            </View>
          )}

          <View
            style={{
              paddingHorizontal: textContainerPaddingHorizontal
                ? responsiveWidth(textContainerPaddingHorizontal)
                : responsiveWidth(3),
              gap: 10,
            }}>
            <AppText
              title={name}
              textColor={AppColors.BLACK}
              textSize={titleFontSize ? titleFontSize : 2.5}
              textFontWeight
              numberOfLines={titleNumOfLines}
              textwidth={titleMaxWidth}
            />
           {item.date && <AppText
              title={item.date}
              textColor={AppColors.BTNCOLOURS}
              textSize={dateFontSize ? dateFontSize : 1.9}
              textFontWeight
              numberOfLines={dateNumOfLines}
              textwidth={dateMaxWidth}
            />}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width:
                  item?.isCompleted || item?.isPaid || isHeartIconMoveToEnd
                    ? responsiveWidth(
                        isHeartIconMoveToEnd
                          ? cardContainerWidth - 12
                          : cardContainerWidth - 35,
                      )
                    : 'auto',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 5,
                  alignItems: 'center',
                }}>
                <Entypo
                  name={'location-pin'}
                  size={responsiveFontSize(2.5)}
                  color={AppColors.BTNCOLOURS}
                />
                <AppText
                  title={address}
                  textColor={AppColors.GRAY}
                  textSize={locationFontSize ? locationFontSize : 2}
                  numberOfLines={locationNumOfLines}
                  textwidth={locationMaxWidth}
                />
              </View>
              {/* {isShowFavIcon ? null : (
                <TouchableOpacity onPress={heartOnPress}>
                  <AntDesign
                    name={item?.isFav ? 'hearto' : 'heart'}
                    size={responsiveFontSize(2.5)}
                    color={AppColors.BTNCOLOURS}
                  />
                </TouchableOpacity>
              )} */}
              {item?.isCompleted ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#07BD74',
                    marginRight: responsiveWidth(4),
                    borderRadius: 7,
                    paddingVertical: responsiveHeight(0.5),
                    width: responsiveWidth(15),
                  }}>
                  <AppText
                    title={'Completed'}
                    textColor={'#07BD74'}
                    textSize={1}
                    textwidth={locationMaxWidth}
                    textAlignment={'center'}
                    textFontWeight
                  />
                </View>
              ) : null}

              {item?.isPaid ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: AppColors.BTNCOLOURS,
                    marginRight: responsiveWidth(4),
                    borderRadius: 7,
                    paddingVertical: responsiveHeight(0.5),
                    width: responsiveWidth(10),
                  }}>
                  <AppText
                    title={'Paid'}
                    textColor={AppColors.BTNCOLOURS}
                    textSize={1}
                    textwidth={locationMaxWidth}
                    textAlignment={'center'}
                    textFontWeight
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {item?.isCompleted || item?.isPaid ? (
          <View
            style={{
              marginTop: responsiveHeight(1),
              alignSelf: 'center',
              width: responsiveWidth(80),
              height: responsiveHeight(0.2),
              backgroundColor: AppColors.DARKGRAY,
            }}
          />
        ) : null}

        {item?.isCompleted || item?.isPaid ? <LineBreak space={2} /> : null}

        {item?.isCompleted || item?.isPaid ? (
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: responsiveWidth(4),
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <AppButton
              title={item?.isPaid ? 'Cancel Booking' : 'Leave a Review'}
              textColor={AppColors.BTNCOLOURS}
              textSize={1.5}
              btnBackgroundColor={'transparent'}
              borderWidth={1}
              borderColor={AppColors.BTNCOLOURS}
              btnWidth={40}
              handlePress={cancelBookingAndLeaveReviewOnPress}
            />
            <AppButton
              title={'View E-Ticket'}
              textColor={AppColors.WHITE}
              btnBackgroundColor={AppColors.THEME_COLOR}
              textSize={1.5}
              btnWidth={40}
              handlePress={viewETicketOnPress}
            />
          </View>
        ) : null}
        <LineBreak space={bottomPadding ? bottomPadding : 2} />
      </TouchableOpacity>
    </>
  );
};

export default RecommendedCard;
