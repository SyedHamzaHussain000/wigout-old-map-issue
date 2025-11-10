import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import AppHeader from './AppHeader';
import {useNavigation} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AppColors from '../utils/AppColors';

const ImageIntroSlider = ({images}) => {
  const navigation = useNavigation();
  


  // Render the item for the slider
  const renderItem = ({item}) => {
    return (
      <ImageBackground source={{uri: item}} style={styles.image}>
        <View style={{paddingVertical: responsiveHeight(2)}}>
          <AppHeader
            onBackPress={() => navigation.goBack()}
            backIconColor={AppColors.WHITE}
            rightIcon={
              <TouchableOpacity>
                <AntDesign
                  name={'hearto'}
                  size={responsiveFontSize(2.5)}
                  color={AppColors.WHITE}
                />
              </TouchableOpacity>
            }
          />
        </View>
      </ImageBackground>
    );
  };

  return (
    <View style={{width: responsiveWidth(100), height: responsiveHeight(50)}}>
      <AppIntroSlider
        data={images}  // Pass images to the slider
        renderItem={renderItem}
        showSkipButton={false}
        showNextButton={false}
        showDoneButton={false}
        dotStyle={{
          backgroundColor: '#ccc',
          height: responsiveWidth(2),
          width: responsiveWidth(2),
        }}
        activeDotStyle={{
          backgroundColor: AppColors.BTNCOLOURS,
          width: responsiveWidth(10),
          height: responsiveWidth(1.5),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: responsiveWidth(100),
    height: responsiveHeight(50),
  },
});

export default ImageIntroSlider;
