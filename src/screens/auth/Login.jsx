/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppColors from '../../utils/AppColors';
import AppHeader from '../../components/AppHeader';
import LineBreak from '../../components/LineBreak';
import AppImages from '../../assets/images/AppImages';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import AppText from '../../components/AppTextComps/AppText';
import AppTextInput from '../../components/AppTextInput';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AppButton from '../../components/AppButton';
import SVGXml from '../../components/SVGXML';
import {AppIcons} from '../../assets/icons';
import {useCustomNavigation} from '../../utils/Hooks';
import {signIn} from '../../GlobalFunctions/auth';
import {signUpAndSignInFormValidation} from '../../utils/Validation';
import {ShowToast} from '../../utils/api_content';
import {setToken, setUserData} from '../../redux/Slices';
import {store} from '../../redux/Store';

// AsyncStorage keys for Remember Me feature
const REMEMBER_ME_EMAIL = '@rememberedEmail';
const REMEMBER_ME_PASSWORD = '@rememberedPassword';
const REMEMBER_ME_ENABLED = '@rememberMeEnabled';

const socialIcons = [
  {
    id: 1,
    icon: <SVGXml icon={AppIcons.facebook_rounded} width={25} height={25} />,
  },
  {
    id: 2,
    icon: <SVGXml icon={AppIcons.google_pay} width={25} height={25} />,
  },
  {
    id: 3,
    icon: <SVGXml icon={AppIcons.black_apple} width={25} height={25} />,
  },
];

const Login = () => {
  const [isFocused, setIsFocused] = useState({email: false, password: false});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const {navigateToRoute} = useCustomNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(REMEMBER_ME_EMAIL);
      const savedPassword = await AsyncStorage.getItem(REMEMBER_ME_PASSWORD);
      const isRememberMeEnabled = await AsyncStorage.getItem(
        REMEMBER_ME_ENABLED,
      );

      if (isRememberMeEnabled === 'true' && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (userEmail, userPassword) => {
    try {
      await AsyncStorage.setItem(REMEMBER_ME_EMAIL, userEmail);
      await AsyncStorage.setItem(REMEMBER_ME_PASSWORD, userPassword);
      await AsyncStorage.setItem(REMEMBER_ME_ENABLED, 'true');
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem(REMEMBER_ME_EMAIL);
      await AsyncStorage.removeItem(REMEMBER_ME_PASSWORD);
      await AsyncStorage.removeItem(REMEMBER_ME_ENABLED);
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  const handleSignIn = async () => {
    const isValid = signUpAndSignInFormValidation(email, password);
    if (isValid === true) {
      setIsLoading(true);
      const res = await signIn({
        email: email?.toLowerCase(),
        password: password,
      });

      if (res.success) {
        // Save or clear credentials based on Remember Me checkbox
        if (rememberMe) {
          await saveCredentials(email, password);
        } else {
          await clearSavedCredentials();
        }

        store.dispatch(setToken(res?.accessToken));
        store.dispatch(setUserData(res?.data));
        ShowToast('success', res?.msg);
        setIsLoading(false);
      } else {
        ShowToast('error', res?.msg || res?.message);
        setIsLoading(false);
      }
    }
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <AppHeader onBackPress={false} />

      <View style={{paddingHorizontal: responsiveWidth(5)}}>
        <View style={{width: responsiveWidth(100), alignItems: 'center'}}>
          <Image
            source={AppImages.signup_logo}
            style={{
              width: responsiveWidth(100),
              height: responsiveHeight(25),
              alignSelf: 'center',
            }}
            resizeMode="contain"
          />
        </View>
        <LineBreak space={2} />

        <AppText
          title={'Login to Your Account'}
          textAlignment={'center'}
          textColor={AppColors.BLACK}
          textFontWeight
          textSize={3}
        />
        <LineBreak space={4} />

        <View>
          <View>
            <AppTextInput
              inputPlaceHolder={'Email'}
              inputWidth={70}
              isFocused={isFocused.email}
              onFocus={() => setIsFocused(prev => ({...prev, email: true}))}
              onBlur={() => setIsFocused(prev => ({...prev, email: false}))}
              placeholderTextColor={AppColors.BLACK}
              value={email}
              onChangeText={text => setEmail(text)}
              logo={
                <MaterialIcons
                  name={'email'}
                  size={responsiveFontSize(2)}
                  color={
                    isFocused.email ? AppColors.BTNCOLOURS : AppColors.GRAY
                  }
                />
              }
            />
          </View>
          <LineBreak space={2} />
          <View>
            <AppTextInput
              inputPlaceHolder={'Password'}
              inputWidth={70}
              isFocused={isFocused.password}
              placeholderTextColor={AppColors.BLACK}
              onFocus={() => setIsFocused(prev => ({...prev, password: true}))}
              onBlur={() => setIsFocused(prev => ({...prev, password: false}))}
              value={password}
              onChangeText={text => setPassword(text)}
              logo={
                <MaterialIcons
                  name={'lock'}
                  size={responsiveFontSize(2)}
                  color={
                    isFocused.password ? AppColors.BTNCOLOURS : AppColors.GRAY
                  }
                />
              }
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(prevState => !prevState)}>
                  <FontAwesome
                    name={showPassword ? 'eye' : 'eye-slash'}
                    size={responsiveFontSize(2)}
                    color={
                      isFocused.password ? AppColors.BTNCOLOURS : AppColors.GRAY
                    }
                  />
                </TouchableOpacity>
              }
              secureTextEntry={!showPassword}
            />
          </View>
          <LineBreak space={2} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 15,
              alignSelf: 'center',
            }}>
            <TouchableOpacity
              style={{
                height: responsiveHeight(3),
                width: responsiveHeight(3),
                borderWidth: rememberMe ? 0 : 3,
                borderRadius: 7,
                borderColor: AppColors.BTNCOLOURS,
                backgroundColor: rememberMe
                  ? AppColors.BTNCOLOURS
                  : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setRememberMe(prevState => !prevState)}>
              {rememberMe ? (
                <FontAwesome
                  name={'check'}
                  size={responsiveFontSize(1.7)}
                  color={AppColors.WHITE}
                />
              ) : (
                <View />
              )}
            </TouchableOpacity>
            <AppText
              title={'Remember me'}
              textColor={AppColors.BLACK}
              textSize={2}
            />
          </View>

          <LineBreak space={2} />

          <View style={{alignItems: 'center'}}>
            <AppButton
              title={'Sign in'}
              handlePress={() => handleSignIn()}
              textSize={1.8}
              btnPadding={18}
              btnWidth={90}
              loading={isLoading}
            />
            <LineBreak space={2} />

            <TouchableOpacity onPress={() => navigateToRoute('ForgotPassword')}>
              <AppText
                title={'Forgot the password?'}
                textAlignment={'center'}
                textColor={AppColors.BTNCOLOURS}
                textSize={2}
                textFontWeight
              />
            </TouchableOpacity>

            <LineBreak space={4} />

            <View style={{flexDirection: 'row', gap: 20, alignItems: 'center'}}>
              <View
                style={{
                  backgroundColor: AppColors.GRAY,
                  width: responsiveWidth(24),
                  height: responsiveHeight(0.1),
                }}
              />
              <AppText
                title={'or continue with'}
                textAlignment={'center'}
                textColor={AppColors.GRAY}
                textSize={2}
              />
              <View
                style={{
                  backgroundColor: AppColors.GRAY,
                  width: responsiveWidth(24),
                  height: responsiveHeight(0.1),
                }}
              />
            </View>

            <LineBreak space={4} />

            <FlatList
              data={socialIcons}
              horizontal
              contentContainerStyle={{
                flex: 1,
                justifyContent: 'center',
                gap: 20,
              }}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: AppColors.appBgColor,
                      width: responsiveWidth(18),
                      height: responsiveHeight(8),
                      borderRadius: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {item.icon}
                  </TouchableOpacity>
                );
              }}
            />
            <LineBreak space={2} />
            <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
              <AppText
                title={'D"ont have an account?'}
                textAlignment={'center'}
                textColor={AppColors.GRAY}
                textSize={2}
              />
              <TouchableOpacity onPress={() => navigateToRoute('SignUp')}>
                <AppText
                  title={'Sign up'}
                  textAlignment={'center'}
                  textColor={AppColors.BTNCOLOURS}
                  textSize={2}
                  textFontWeight
                />
              </TouchableOpacity>
            </View>
            <LineBreak space={2} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Login;
