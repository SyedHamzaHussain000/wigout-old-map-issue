/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {View, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppColors from '../../utils/AppColors';
import AppImages from '../../assets/images/AppImages';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import {useCustomNavigation} from '../../utils/Hooks';

const ONBOARDING_KEY = '@hasSeenOnBoarding';

const Splash = () => {
  const {navigateToRoute} = useCustomNavigation();

  useEffect(() => {
    const checkOnBoardingStatus = async () => {
      try {
        const hasSeenOnBoarding = await AsyncStorage.getItem(ONBOARDING_KEY);

        setTimeout(() => {
          if (hasSeenOnBoarding === 'true') {
            // User has seen OnBoarding before, skip to GetStarted
            navigateToRoute('Login');
          } else {
            // First time user, show OnBoarding
            navigateToRoute('OnBoarding');
          }
        }, 1500);
      } catch (error) {
        console.error('Error checking OnBoarding status:', error);
        // On error, default to showing OnBoarding
        setTimeout(() => {
          navigateToRoute('OnBoarding');
        }, 1500);
      }
    };

    checkOnBoardingStatus();
  }, [navigateToRoute]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.BTNCOLOURS,
      }}>
      <View
        style={{flex: 0.9, justifyContent: 'center', alignItems: 'flex-end'}}>
        <Image
          source={AppImages.app_name}
          style={{width: responsiveWidth(100), height: responsiveHeight(100)}}
          resizeMode="contain"
        />
      </View>
      <View style={{flex: 1}}>
        <Image
          source={AppImages.main_logo}
          style={{width: responsiveWidth(100), height: responsiveHeight(78)}}
        />
      </View>
    </View>
  );
};

export default Splash;
