/* eslint-disable react-native/no-inline-styles */
import React, {useRef} from 'react';
import {ImageBackground, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIntroSlider from 'react-native-app-intro-slider';
import AppImages from '../../assets/images/AppImages';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import AppText from '../../components/AppTextComps/AppText';
import AppColors from '../../utils/AppColors';
import AppButton from '../../components/AppButton';
import LineBreak from '../../components/LineBreak';
import {useCustomNavigation} from '../../utils/Hooks';

const ONBOARDING_KEY = '@hasSeenOnBoarding';

const OnBoarding = () => {
  const AppIntroSliderRef = useRef(null);
  const {navigateToRoute} = useCustomNavigation();

  const handleOnBoardingComplete = async () => {
    try {
      // Mark OnBoarding as completed
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      navigateToRoute('GetStarted');
    } catch (error) {
      console.error('Error saving OnBoarding status:', error);
      // Navigate anyway even if storage fails
      navigateToRoute('GetStarted');
    }
  };

  const slides = [
    {
      key: 1,
      title: 'Never forget what you thought of a place!',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      image: AppImages.main_logo,
      backgroundColor: '#59b2ab',
    },
    {
      key: 2,
      title: 'Easy tracking and personalized reminders',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      image: AppImages.main_logo,
      backgroundColor: '#febe29',
    },
    {
      key: 3,
      title: 'Let"s go to your favorite place right now!',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
      image: AppImages.main_logo,
      backgroundColor: '#22bcb5',
    },
  ];
  return (
    <View style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <AppIntroSlider
        data={slides}
        ref={AppIntroSliderRef}
        activeDotStyle={{
          backgroundColor: AppColors.BTNCOLOURS,
        }}
        dotStyle={{
          backgroundColor: AppColors.LIGHTGRAY,
        }}
        renderNextButton={() => {
          return (
            <AppButton
              title={'Next'}
              handlePress={() => {
                AppIntroSliderRef?.current?.goToSlide(
                  AppIntroSliderRef.current.state.activeIndex + 1,
                  true,
                );
              }}
            />
          );
        }}
        renderDoneButton={() => {
          return (
            <AppButton title={'Done'} handlePress={handleOnBoardingComplete} />
          );
        }}
        renderItem={({item, index}) => {
          return (
            <ImageBackground
              source={item.image}
              resizeMode="contain"
              style={{
                width: '100%',
                height: '91%',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}>
              <View
                style={{
                  height: responsiveHeight(32),
                  width: responsiveWidth(100),
                  gap: 12,
                }}>
                <LineBreak space={8} />

                <AppText
                  title={item.title}
                  textAlignment={'center'}
                  textSize={3.5}
                  textColor={AppColors.BTNCOLOURS}
                  textFontWeight
                  textwidth={80}
                />
                <AppText
                  title={item.text}
                  textAlignment={'center'}
                  textSize={1.8}
                  textColor={AppColors.GRAY}
                  textwidth={80}
                />
              </View>
            </ImageBackground>
          );
        }}
        bottomButton={true}
      />
    </View>
  );
};

export default OnBoarding;
