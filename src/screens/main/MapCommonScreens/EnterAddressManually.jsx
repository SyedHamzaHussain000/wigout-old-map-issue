import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, {useRef, useState} from 'react';

import {Google_API_KEY, Google_Base_Url} from '../../../utils/api_content';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import AppColors from '../../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import AppText from '../../../components/AppTextComps/AppText';
import axios from 'axios';
import {useDispatch} from 'react-redux';
import {setCurrentLocation} from '../../../redux/Slices';

const EnterAddressManually = ({navigation}) => {
  const inputRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [selection, setSelection] = useState('');
  const [loader, setLoader] = useState(false);

  const dispatch = useDispatch();

  const setSearchLocation = async searchKey => {
    // alert(‘hello’)
    setSelection(searchKey);
    const BASE_URL = `${Google_Base_Url}place/autocomplete/json?input=${searchKey}&key=${Google_API_KEY}&types=airport&components=country:us`;
    const response = await axios.get(BASE_URL, {
      params: {
        key: Google_API_KEY,
        input: 'Restaurants',
        inputtype: 'textquery',
        radius: 5000,
      },
    });

    setPredictions(response?.data?.predictions);
  };

  const selectLocation = async placeDetail => {
      try {
          setLoader(true)
        const response = await axios.get(
          `${Google_Base_Url}place/details/json`,
          {
            params: {
              place_id: placeDetail.place_id,
              key: Google_API_KEY,
            },
          },
        );

        const location = response.data.result.geometry.location;

        dispatch(
          setCurrentLocation({latitude: location.lat, longitude: location.lng, address: placeDetail.description}),
        );
        setLoader(false)
        navigation.goBack()
        return location;
      } catch (error) {
        setLoader(false)
        console.error('Error fetching place details:', error);
      }


    // console.log('first', placeDetail);
    // return;
  };

  return (
    <View style={{padding: 20}}>
      <TextInput
        autoCapitalize="none"
        ref={inputRef}
        onChangeText={setSearchLocation}
        style={{
          color: AppColors.BLACK,
          borderWidth: 1,
          borderRadius: 10,
          height: 50,
        }}
        placeholderTextColor={AppColors.LIGHTGRAY}
        placeholder={'Enter Address'}
        autoCorrect={false}
        value={selection}
      />

      {predictions && predictions?.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: '150%',
            alignSelf: 'center',
            width: responsiveWidth(90),
            backgroundColor: AppColors.WHITE,
            shadowColor: AppColors.BLACK,
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            borderRadius: 1,
            elevation: 5,
            zIndex: 3,
            padding: 10,
          }}>
          <ScrollView>
            {predictions?.map((val, index) => {
              return (
                <TouchableOpacity
                  onPress={() => selectLocation(val)}
                  style={{marginTop: 10}}>
                  <AppText
                    title={val.description}
                    textColor={AppColors.BLACK}
                    textSize={1.8}
                  />
                  <View
                    style={{
                      height: 1,
                      width: responsiveWidth(80),
                      backgroundColor: AppColors.BLACK,
                      marginTop: 10,
                    }}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default EnterAddressManually;

const styles = StyleSheet.create({
  inputField: {
    borderRadius: 50,
    width: responsiveWidth(90),
    height: responsiveHeight(5),
    paddingHorizontal: '5%',
    paddingVertical: Platform.OS === 'android' && 0,
    color: AppColors.RED_COLOR,
    // fontFamily: "Montserrat-Regular",
    textAlign: 'center',
    fontSize: 2,
    fontWeight: '600',
  },
});
