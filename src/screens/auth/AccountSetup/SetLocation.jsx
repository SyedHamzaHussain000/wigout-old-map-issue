/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  ImageBackground,
  KeyboardAvoidingView,
  Image,
  Alert,
} from 'react-native';
import AppHeader from '../../../components/AppHeader';
import AppColors from '../../../utils/AppColors';
import {responsiveHeight} from '../../../utils/Responsive_Dimensions';
import AppImages from '../../../assets/images/AppImages';
import LocationModal from '../../../components/LocationModal';
import {useCustomNavigation} from '../../../utils/Hooks';
import {useRoute} from '@react-navigation/native';
import {createProfile} from '../../../GlobalFunctions/auth';
import {ShowToast} from '../../../utils/api_content';
import {store} from '../../../redux/Store';
import {setCurrentLocation, setToken, setUserData} from '../../../redux/Slices';
import MapView, {
  Marker,
  MarkerAnimated,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import {useDispatch, useSelector} from 'react-redux';
import LatLngIntoAddress from '../../../GlobalFunctions/other/LatLngIntoAddress';
import {GetCurrentLocation} from '../../../GlobalFunctions/other/GetCurrentLocation';
import AppText from '../../../components/AppTextComps/AppText';
import FetchNearbyPlaces from '../../../ApiCalls/Main/FetchNearbyPlaces';

const SetLocation = ({navigation}) => {
  const {navigateToRoute} = useCustomNavigation();
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [allNearbyPlaces, setAllNearbyPlaces] = useState([]);
  const data = useRoute()?.params?.data;
  const currentLocation = useSelector(state => state.user.current_location);

  const userData = useSelector(state => state?.user?.userData);
  const token = useSelector(state => state?.user?.token);
  const fetchNearbyPlaces = useSelector(state => state?.user?.places_nearby);

  const mapRef = useRef(null);

  const dipatch = useDispatch();
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        },
        1000,
      );
    }
  }, [currentLocation]);

  useEffect(() => {
    if (userData?.isCreated == true) {
      if (allNearbyPlaces?.length > 0) {
        navigateToRoute('Main', {
          screen: 'Discover',
        });
      }
    }
  }, [allNearbyPlaces]);

  const fetchCurrentLocation = async () => {
    setLocationLoading(true);
    const location = await GetCurrentLocation();

    const _LatLngIntoAddress = await LatLngIntoAddress(
      location.latitude,
      location.longitude,
    );

    dipatch(
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: _LatLngIntoAddress,
      }),
    );
    setLocationLoading(false);
    const res = await FetchNearbyPlaces(location, dipatch);
    setAllNearbyPlaces(res);
  };

  const handleLocationContinue = async () => {
    if (!currentLocation.address) {
      return ShowToast('error', 'Location is required');
    }


    const fetchResponnse = await FetchNearbyPlaces(
          currentLocation,
          dipatch,
        );

        console.log("fetchResponnse",fetchResponnse)

    if (userData?.isCreated == true) {
      // Alert.alert("calling")

      try {
        



        setAllNearbyPlaces(fetchResponnse);
        navigateToRoute('Main', {
          screen: 'Discover',
        });
      } catch (error) {
        console.log('Error in fetching nearby places', error);
      }
    } else {
      setIsLoading(true);
      const res = await createProfile({
        id: data?.userId,
        fullName: data?.fullName,
        nickName: data?.nickName,
        image: data?.image,
        number: data?.number,
        locationName: currentLocation.address,
        gender: data?.gender,
        date: data?.date,
      });
      
      if (res?.success) {
        ShowToast('success', 'Profile Created Successfully');
        store.dispatch(setToken(data?.token));
        store.dispatch(setUserData(res?.data));
      } else {
        ShowToast('error', res?.msg || res?.message);
      }

      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
      <View style={{flex: 1}}>
        <View
          style={{
            backgroundColor: AppColors.WHITE,
            paddingBottom: responsiveHeight(4),
            paddingTop: responsiveHeight(2),
          }}>
          <AppHeader onBackPress heading={'Set Your Location'} />
        </View>

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          poiClickEnabled={true}
          style={{flex: 1}}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.78825,
            longitude: currentLocation?.longitude || -122.4324,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}>
          <Marker
            tracksViewChanges={false}
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}>
            <Image
              source={AppImages.LOCATION_MARK}
              style={{height: 40, width: 40}}
            />
          </Marker>
        </MapView>

        <LocationModal
          value={currentLocation.address || 'Enter your location manually'}
          onChangeText={text => setLocationName(text)}
          handlePress={() => handleLocationContinue()}
          loading={isLoading}
          fetchCurrentLocation={() => fetchCurrentLocation()}
          locationLoading={locationLoading}
        />

        {/* <ImageBackground source={AppImages.LOCATION} style={{flex: 1}}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            
          </View>
        </ImageBackground> */}
      </View>
    </KeyboardAvoidingView>
  );
};

export default SetLocation;
