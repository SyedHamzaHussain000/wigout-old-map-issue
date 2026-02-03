/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {View} from 'react-native';
import AppColors from '../../utils/AppColors';
import {SafeAreaView} from 'react-native-safe-area-context';
import {responsiveWidth} from '../../utils/Responsive_Dimensions';
import AppHeader from '../../components/AppHeader';
import LineBreak from '../../components/LineBreak';
import AppTextInput from '../../components/AppTextInput';
import {useCustomNavigation} from '../../utils/Hooks';
import AppButton from '../../components/AppButton';
import {ShowToast} from '../../utils/api_content';
import {forgotPassword} from '../../GlobalFunctions/auth';

const EmailForForgotPassword = () => {
  const {navigateToRoute} = useCustomNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      return ShowToast('error', 'Email is required');
    }

    setIsLoading(true);

    const res = await forgotPassword({email: email?.toLowerCase()});

    if (res?.success) {
      ShowToast('success', res?.msg);
      navigateToRoute('OtpVerification', {
        email: email?.toLowerCase(),
        userId: res?.data?.userId,
      });
    } else {
      ShowToast('error', res?.msg || res?.message);
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <AppHeader onBackPress heading={'Forgot Password'} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: responsiveWidth(4),
        }}>
        <LineBreak space={5} />
        <AppTextInput
          inputPlaceHolder={'Email'}
          value={email}
          onChangeText={text => setEmail(text)}
        />
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: responsiveWidth(4),
        }}>
        <AppButton
          title={'Continue'}
          textColor={AppColors.WHITE}
          textSize={2}
          btnPadding={15}
          handlePress={() => handleForgotPassword()}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

export default EmailForForgotPassword;
