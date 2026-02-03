/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, TextInput} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import AppColors from '../utils/AppColors';

type props = {
  logo?: any;
  inputPlaceHolder?: any;
  inputBgColour?: any;
  inputWidth?: number;
  containerBg?: any;
  rightIcon?: any;
  secureTextEntry?: any;
  placeholderTextColor?: any;
  inputHeight?: any;
  textAlignVertical?: any;
  placeholderTextfontWeight?: any;
  multiline?: any;
  value?: any;
  onChangeText?: any;
  onFocus?: any;
  borderWidth?: any;
  borderColor?: any;
  onBlur?: any;
  isFocused?: any;
  readOnly?: any;
  defaultValue?: any;
  maxLength?: any;
};
const AppTextInput = ({
  logo,
  secureTextEntry,
  inputPlaceHolder,
  inputWidth = 68,
  containerBg,
  rightIcon,
  placeholderTextColor,
  inputHeight,
  textAlignVertical,
  placeholderTextfontWeight,
  multiline,
  value,
  onChangeText,
  onFocus,
  onBlur,
  borderWidth,
  borderColor,
  isFocused,
  readOnly,
  defaultValue,
  maxLength,
}: props) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: containerBg
          ? containerBg
          : isFocused
          ? AppColors.inputBlur
          : AppColors.inputBg,
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        borderWidth: isFocused ? 1 : borderWidth || 1,
        borderColor: isFocused
          ? AppColors.BTNCOLOURS
          : borderColor || AppColors.WHITE,
      }}>
      {logo}

      <TextInput
        placeholder={inputPlaceHolder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={
          placeholderTextColor ? placeholderTextColor : AppColors.GRAY
        }
        defaultValue={defaultValue}
        style={{
          width: responsiveWidth(inputWidth),
          color: AppColors.BLACK,
          height: inputHeight ? responsiveHeight(inputHeight) : null,
          fontWeight: placeholderTextfontWeight
            ? placeholderTextfontWeight
            : null,
        }}
        readOnly={readOnly}
        secureTextEntry={secureTextEntry}
        textAlignVertical={textAlignVertical}
        multiline={multiline}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={maxLength}
      />

      {rightIcon}
    </View>
  );
};

export default AppTextInput;
