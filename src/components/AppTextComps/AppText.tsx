/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text} from 'react-native';
import AppColors from '../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';

type textProps = {
  title?: any;
  textSize?: any;
  textColor?: any;
  textFontWeight?: boolean;
  textAlignment?: any;
  textwidth?: any;
  lineHeight?: any;
  numberOfLines?: any;
  borderBottomColor?: any;
  borderBottomWidth?: any;
  paddingBottom?: any;
  textTransform?: any;
  paddingHorizontal?: any;
};

const AppText = ({
  title,
  textSize,
  textColor,
  textFontWeight,
  textAlignment,
  textwidth,
  lineHeight,
  numberOfLines,
  borderBottomColor,
  borderBottomWidth,
  paddingBottom,
  textTransform,
  paddingHorizontal,
}: textProps) => {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        width: textwidth ? responsiveWidth(textwidth) : null,
        fontSize: textSize
          ? responsiveFontSize(textSize)
          : responsiveFontSize(1.4),
        fontWeight: textFontWeight ? 'bold' : 'regular',
        color: textColor ? textColor : AppColors.BLACK,
        textAlign: textAlignment ? textAlignment : null,
        alignSelf: textAlignment ? textAlignment : null,
        lineHeight: lineHeight ? responsiveHeight(lineHeight) : null,
        borderBottomWidth: borderBottomWidth ? borderBottomWidth : null,
        borderBottomColor: borderBottomColor ? borderBottomColor : null,
        textTransform: textTransform ? textTransform : null,
        paddingBottom: paddingBottom ? responsiveHeight(paddingBottom) : null,
        paddingHorizontal: paddingHorizontal
          ? responsiveWidth(paddingHorizontal)
          : null,
      }}>
      {title}
    </Text>
  );
};

export default AppText;
