/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import PhoneInput from 'react-native-phone-input';
import AppColors from '../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';

const PhoneInputScreen = ({phoneRef, defaultVal}) => {
  const countryPickerRef = useRef(null);
  const [pickerData, setPickerData] = useState([]);

  useEffect(() => {
    if (phoneRef.current) {
      // console.log("phoneRef.current.getPickerData()",phoneRef.current.getPickerData())
      setPickerData(phoneRef.current.getPickerData());
    }
  }, []);

  const onPressFlag = () => {
    countryPickerRef.current?.open();
  };

  const selectCountry = country => {
    phoneRef.current?.selectCountry(country.iso2);
  };

  return (
    <View>
      <PhoneInput
        ref={phoneRef}
        onPressFlag={onPressFlag}
        initialCountry={'us'}
        initialValue={defaultVal}
        style={{
          paddingHorizontal: responsiveWidth(7),
          height: responsiveHeight(7),
          borderRadius: 12,
          backgroundColor: AppColors.inputBg,
        }}
        textStyle={{color: AppColors.BLACK, marginLeft: 10}}
        autoFormat
        textProps={{
          placeholder: '+1 000 000 000',
        }}
      />

      {/* <CountryPicker
        ref={countryPickerRef}
        data={pickerData}
        onChange={(country) => selectCountry(country)}
        cancelText="Cancel"
      /> */}
    </View>
  );
};

export default PhoneInputScreen;
