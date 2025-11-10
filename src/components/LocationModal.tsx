/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Install this library if not already
import AppTextInput from './AppTextInput';
import AppButton from './AppButton';
import AppColors from '../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import AppText from './AppTextComps/AppText';
import LineBreak from './LineBreak';
import { useNavigation } from '@react-navigation/native';
import Foundation from 'react-native-vector-icons/Foundation'
type ModalProps = {
  value?: any;
  onChangeText?: any;
  handlePress?: any;
  loading?: any;
  fetchCurrentLocation?: any;
  locationLoading?:any
};

const LocationModal = ({value, onChangeText, handlePress, loading, fetchCurrentLocation, locationLoading}: ModalProps) => {
  const navigation = useNavigation()
  return (
    <View style={styles.modal}>
      <View>
        <LineBreak space={0.7} />

        <View
          style={{
            backgroundColor: AppColors.WHITE,
            borderRadius: 100,
            height: responsiveHeight(0.5),
            width: responsiveWidth(10),
            alignSelf: 'center',
          }}
        />
        <LineBreak space={3} />
        <View style={{gap: 20}}>
          <AppText
            title={'Location'}
            textSize={2.5}
            textColor={AppColors.BLACK}
            textAlignment={'center'}
            textFontWeight
          />

        {
          locationLoading == true ? (
            <ActivityIndicator size={'large'} color={AppColors.BLUE}/>
          ):(
        <TouchableOpacity onPress={()=> fetchCurrentLocation()} style={{flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10}}>
          <Foundation
          name="target-two"
          size={20}
          color={AppColors.BLUE}
          
          />
          <AppText title={"Fetch Current Location"} textColor={AppColors.BLUE} textSize={1.8} textAlignment={'center'}/>
        </TouchableOpacity>

          )
        }

          <TouchableOpacity
            onPress={() => navigation.navigate("EnterAddressManually")}
            style={{
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderBottomColor: AppColors.appBgColor,
              borderTopColor: AppColors.appBgColor,
              paddingVertical: responsiveHeight(2),
              width:responsiveWidth(80),
              alignSelf:'center'
            }}>
              <View style={{flexDirection:'row', alignItems:'center', alignSelf:'center'}}>
                <AppText textSize={1.8} title={value} textAlignment={'center'} />
                <Icon
                  name="location-sharp"
                  size={responsiveFontSize(2)}
                  color={AppColors.BLACK}
                />
              </View>
            {/* <AppTextInput
              inputPlaceHolder={'Times Square NYC, Manhattan'}
              inputWidth={73}
              value={value}
              onChangeText={onChangeText}
              rightIcon={
                <Icon
                  name="location-sharp"
                  size={responsiveFontSize(2)}
                  color={AppColors.BLACK}
                />
              }
            /> */}

          </TouchableOpacity>
          <AppButton
            title={'Continue'}
            textColor={AppColors.WHITE}
            textSize={2}
            btnPadding={18}
            handlePress={handlePress}
            loading={loading}
          />

          <LineBreak space={1} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: AppColors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: responsiveHeight(40),
    width: responsiveWidth(100),
    paddingHorizontal: responsiveWidth(5),
  },
});

export default LocationModal;
