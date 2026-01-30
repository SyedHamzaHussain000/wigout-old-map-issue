/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState, memo } from 'react';
import {
  View,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import AppText from '../../../components/AppTextComps/AppText';
import AppColors from '../../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import Entypo from 'react-native-vector-icons/Entypo';
import LineBreak from '../../../components/LineBreak';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AppImages from '../../../assets/images/AppImages';
import RecommendedCard from '../../../components/RecommendedCard';
import { oneData } from '../../../utils/LocalData';
import MapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { baseUrl, Google_Places_Images } from '../../../utils/api_content';

const Explore = ({ navigation }) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const mapRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const currentLocation = useSelector(state => state.user.current_location);
  const fetchedLocations = useSelector(state => state?.user?.places_nearby);


  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        clusterColor={AppColors.BTNCOLOURS}
        animationEnabled={false}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.78825,
          longitude: currentLocation?.longitude || -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}>

        {/* USER LOCATION MARKER */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}>
            <ImageBackground
              source={{ uri: `${baseUrl}/${userData?.profileImage}` }}
              style={{
                height: 35,
                width: 35,
                borderRadius: 200,
                overflow: 'hidden',
              }}
            />
          </Marker>
        )}

        {/* FETCHED LOCATIONS */}
        {Array.isArray(fetchedLocations) &&
          fetchedLocations.length > 0 &&
          fetchedLocations.slice(0, 5).map((place, index) => {
            const lat = place?.geometry?.location?.lat;
            const lng = place?.geometry?.location?.lng;
            const photoRef = place?.photos?.[0]?.photo_reference;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            return (
              <OptimizedMarker
                key={index}
                place={place}
                photoRef={photoRef}
                navigation={navigation}
                coordinate={{ latitude: lat, longitude: lng }}
              />
            );
          })}
      </MapView>

      {/* LOCATION HEADER */}
      <View
        style={{
          backgroundColor: AppColors.WHITE,
          paddingHorizontal: responsiveWidth(4),
          paddingVertical: responsiveHeight(2),
          borderRadius: 25,
          position: 'absolute',
          zIndex: 10,
          top: 20,
          alignSelf: 'center',
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <Entypo
                name={'location-pin'}
                size={responsiveFontSize(2.5)}
                color={AppColors.BTNCOLOURS}
              />
              <AppText
                title={'Location (within 1 km)'}
                textColor={AppColors.BLACK}
                textSize={1.7}
              />
            </View>

            <LineBreak space={1} />

            <AppText
              title={currentLocation?.address || 'Add location'}
              textColor={AppColors.BLACK}
              textSize={1.7}
              textFontWeight
              textwidth={60}
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('SetLocation')}
            style={{
              backgroundColor: AppColors.BTNCOLOURS,
              paddingHorizontal: responsiveWidth(3),
              paddingVertical: responsiveHeight(1),
              borderRadius: 20,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
            }}>
            <AntDesign
              name={'edit'}
              size={responsiveFontSize(1.3)}
              color={AppColors.WHITE}
            />

            <AppText
              title={'Change'}
              textColor={AppColors.WHITE}
              textSize={1.3}
              textFontWeight
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* RECOMMENDED CARD */}
      <View
        style={{
          position: 'absolute',
          zIndex: 10,
          bottom: 20,
          alignSelf: 'center',
        }}>
        <RecommendedCard
          item={oneData}
          cardContainerWidth={true ? 90 : 43}
          cardWidth={true ? 15 : 19}
          titleFontSize={2}
          dateFontSize={1.5}
          locationFontSize={1.3}
          containerPaddingHorizontal={2}
          textContainerPaddingHorizontal={2}
          containerPaddingVertical={1}
          containerborderRadius={25}
          cardContainerBackgroundColor={AppColors.WHITE}
          bottomPadding={1}
          dateNumOfLines={1}
          dateMaxWidth={true ? 'auto' : 35}
          locationNumOfLines={1}
          locationMaxWidth={true ? 'auto' : 21}
          titleMaxWidth={35}
          titleNumOfLines={1}
          containerFlexDirection={true ? 'row' : 'column'}
          containerAlignItems={true ? 'center' : 'flex-start'}
          containerGap={true ? 5 : 0}
        />
      </View>
    </View>
  );
};

/* ✅ Optimized Marker Component (memoized + cached image) */
const OptimizedMarker = memo(({ place, coordinate, photoRef, navigation }) => {
  const imageUrl = photoRef
    ? `${Google_Places_Images}${photoRef}&maxwidth=100`
    : null;

  return (
    <Marker
      coordinate={coordinate}
      onPress={() =>
        navigation.navigate('HomeDetails', { placeDetails: place })
      }>
      {imageUrl ? (
        <FastImage
          source={{ uri: imageUrl }}
          style={{ height: 35, width: 35, borderRadius: 20 }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <FastImage
          source={AppImages.LOCATION_MARK}
          style={{ height: 35, width: 35, borderRadius: 20 }}
          resizeMode={FastImage.resizeMode.contain}
        />
      )}
    </Marker>
  );
});

export default Explore;
