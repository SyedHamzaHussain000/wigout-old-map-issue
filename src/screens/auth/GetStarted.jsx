import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import AppColors from '../../utils/AppColors';
import AppHeader from '../../components/AppHeader';
import LineBreak from '../../components/LineBreak';
import AppImages from '../../assets/images/AppImages';
import AppText from '../../components/AppTextComps/AppText';
import AppButton from '../../components/AppButton';
import SVGXml from '../../components/SVGXML';
import {AppIcons} from '../../assets/icons';
import {useCustomNavigation} from '../../utils/Hooks';
import ScreenWrapper from '../../components/ScreenWrapper';

import {socialLogin} from '../../GlobalFunctions/auth';
import {ShowToast} from '../../utils/api_content';
import {setToken, setUserData} from '../../redux/Slices';
import {store} from '../../redux/Store';
import {getFcmToken} from '../../GlobalFunctions/other/Firebase';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import notifee from '@notifee/react-native';
import {requestUserPermission} from '../../utils/Notifications';

const GetStarted = () => {
  const {navigateToRoute} = useCustomNavigation();
  const [gLoading, setGLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getFcmToken();
        setFcmToken(token);
      } catch (err) {
        console.error('FCM Error:', err);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const initNotificationsOnGetStarted = async () => {
        // Explicit Notifee permission request for Android 13+
        await notifee.requestPermission();
        const granted = await requestUserPermission();
        console.log('Notification Permission Granted on GetStarted:', granted);
      };

      initNotificationsOnGetStarted();
    }, 1000);
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    if (gLoading) return;
    setGLoading(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      await GoogleSignin.signOut();
      const {data} = await GoogleSignin.signIn();

      const res = await socialLogin({
        email: data?.user?.email,
        socialType: 'Google',
        socialId: data?.user?.id,
        fcmToken,
      });

      if (res?.success) {
        store.dispatch(setToken(res?.token));
        store.dispatch(setUserData(res?.data));
        ShowToast('success', 'Login Successful');
      } else {
        ShowToast('error', res?.msg || 'Authentication Failed');
      }
    } catch (err) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        ShowToast('error', err?.message || 'Something went wrong');
      }
    } finally {
      setGLoading(false);
    }
  }, [fcmToken, gLoading]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <AppHeader onBackPress={false} />

        <View style={styles.content}>
          <Image
            source={AppImages.get_started}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <LineBreak space={2} />

          <AppText
            title={'Let’s you in'}
            textAlignment={'center'}
            textColor={AppColors.graysh}
            textFontWeight
            textSize={5}
          />

          <LineBreak space={4} />

          <View style={styles.buttonGap}>
            <AppButton
              handlePress={handleGoogleSignIn}
              title={'Continue with Google'}
              btnBackgroundColor={AppColors.WHITE}
              textColor={AppColors.BLACK}
              borderWidth={1}
              borderColor={AppColors.DARKGRAY}
              loading={gLoading}
              leftIcon={
                <SVGXml icon={AppIcons.google_pay} width={20} height={20} />
              }
            />

            {Platform.OS === 'ios' && (
              <AppButton
                title={'Continue with Apple'}
                btnBackgroundColor={AppColors.WHITE}
                textColor={AppColors.BLACK}
                borderWidth={1}
                borderColor={AppColors.DARKGRAY}
                leftIcon={
                  <SVGXml icon={AppIcons.black_apple} width={20} height={20} />
                }
              />
            )}
          </View>

          <LineBreak space={4} />

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <AppText title={'or'} textColor={AppColors.graysh} textSize={2} />
            <View style={styles.line} />
          </View>

          <LineBreak space={4} />

          <AppButton
            title={'Sign in with password'}
            handlePress={() => navigateToRoute('Login')}
            btnPadding={18}
          />

          <LineBreak space={4} />

          <View style={styles.footerRow}>
            <AppText
              title={'Don’t have an account?'}
              textColor={AppColors.graysh}
              textSize={2}
            />
            <TouchableOpacity onPress={() => navigateToRoute('SignUp')}>
              <AppText
                title={'Sign up'}
                textColor={AppColors.BTNCOLOURS}
                textSize={2}
                textFontWeight
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: responsiveWidth(5),
    alignItems: 'center',
    flex: 1,
  },
  heroImage: {
    width: responsiveWidth(100),
    height: responsiveHeight(23),
  },
  buttonGap: {
    gap: 15,
    width: '100%',
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    width: '90%',
  },
  line: {
    backgroundColor: AppColors.graysh,
    flex: 1,
    height: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});

export default GetStarted;

// /* eslint-disable react-native/no-inline-styles */
// import React, {useEffect, useState} from 'react';
// import {View, Image, TouchableOpacity, Platform} from 'react-native';
// import AppColors from '../../utils/AppColors';
// import AppHeader from '../../components/AppHeader';
// import LineBreak from '../../components/LineBreak';
// import {
//   responsiveHeight,
//   responsiveWidth,
// } from '../../utils/Responsive_Dimensions';
// import AppImages from '../../assets/images/AppImages';
// import AppText from '../../components/AppTextComps/AppText';
// import AppButton from '../../components/AppButton';
// import SVGXml from '../../components/SVGXML';
// import {AppIcons} from '../../assets/icons';
// import {useCustomNavigation} from '../../utils/Hooks';
// import ScreenWrapper from '../../components/ScreenWrapper';
// import {socialLogin} from '../../GlobalFunctions/auth';
// import {ShowToast} from '../../utils/api_content';
// import {setToken, setUserData} from '../../redux/Slices';
// import {store} from '../../redux/Store';
// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin';
// import {getFcmToken} from '../../GlobalFunctions/other/Firebase';

// const GetStarted = () => {
//   const {navigateToRoute} = useCustomNavigation();
//   const [gLoading, setGLoading] = useState(false);
//   const [fcmToken, setFcmToken] = useState('');

//   useEffect(() => {
//     const fetchFcmToken = async () => {
//       try {
//         const newFcmToken = await getFcmToken();
//         console.log('FCM Token:-', newFcmToken);
//         setFcmToken(newFcmToken);
//       } catch (err) {
//         console.log('Error fetching FCM token:', err);
//       }
//     };
//     fetchFcmToken();
//   }, []);

//   const handleGoogleSignIn = async () => {
//     if (gLoading) {
//       return;
//     }
//     setGLoading(true);
//     try {
//       if (Platform.OS === 'android') {
//         await GoogleSignin.hasPlayServices({
//           showPlayServicesUpdateDialog: true,
//         });
//       }

//       await GoogleSignin.signOut();

//       const signInResult = await GoogleSignin.signIn();

//       console.log('Google signInResult:', signInResult);

//       const body = {
//         email: signInResult?.data?.user?.email,
//         socialType: 'Google',
//         socialId: signInResult?.data?.user?.id,
//         fcmToken: fcmToken,
//       };

//       console.log('body in socialLogin:-', body);
//       const res = await socialLogin(body);
//       console.log('res in socialLogin:-', res);

//       if (res?.success) {
//         store.dispatch(setToken(res?.token));

//         let data = res?.data;
//         // if (data?.userName) {
//         //   data = {...data, isCreated: true};
//         // } else {
//         //   data = {...data, isCreated: false};
//         // }
//         store.dispatch(setUserData(data));

//         ShowToast('success', res?.msg || 'Login Successful');
//       } else {
//         ShowToast('error', res?.msg || res?.message || 'Authentication Failed');
//       }
//     } catch (err) {
//       if (err.code === statusCodes.SIGN_IN_CANCELLED) {
//         console.log('Google sign-in cancelled');
//       } else if (err.code === statusCodes.IN_PROGRESS) {
//         console.log('Google sign-in already in progress');
//       } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
//         ShowToast('error', 'Google Play Services not available');
//       } else {
//         console.log(
//           'Google sign-in error full details:',
//           JSON.stringify(err, null, 2),
//         );
//         console.log('Google sign-in error:', err);
//         ShowToast('error', err?.message || 'Something went wrong');
//       }
//     } finally {
//       setGLoading(false);
//     }
//   };

//   return (
//     <ScreenWrapper>
//       <View style={{flex: 1}}>
//       <AppHeader onBackPress={false} />
//       <LineBreak space={5} />

//       <View style={{paddingHorizontal: responsiveWidth(5)}}>
//         <View style={{alignItems: 'center'}}>
//           <Image
//             source={AppImages.get_started}
//             style={{width: responsiveWidth(100), height: responsiveHeight(23)}}
//             resizeMode="contain"
//           />

//           <LineBreak space={2} />

//           <AppText
//             title={'Let’s you in'}
//             textAlignment={'center'}
//             textColor={AppColors.BLACK}
//             textFontWeight
//             textSize={5}
//           />
//           <LineBreak space={2} />

//           {/* <View>
//             <AppButton
//               title={'Continue with Facebook'}
//               btnBackgroundColor={AppColors.WHITE}
//               textColor={AppColors.BLACK}
//               textSize={1.8}
//               borderWidth={1}
//               btnPadding={15}
//               borderColor={AppColors.DARKGRAY}
//               btnWidth={90}
//               borderRadius={10}
//               leftIcon={
//                 <View style={{paddingHorizontal: responsiveWidth(2)}}>
//                   <SVGXml
//                     icon={AppIcons.facebook_rounded}
//                     width={20}
//                     height={20}
//                   />
//                 </View>
//               }
//             />
//           </View> */}

//           <LineBreak space={2} />

//           <View>
//             <AppButton
//               handlePress={handleGoogleSignIn}
//               title={'Continue with Google'}
//               btnBackgroundColor={AppColors.WHITE}
//               textColor={AppColors.BLACK}
//               textSize={1.8}
//               borderWidth={1}
//               btnPadding={15}
//               borderColor={AppColors.DARKGRAY}
//               btnWidth={90}
//               borderRadius={10}
//               leftIcon={
//                 <View style={{paddingHorizontal: responsiveWidth(2)}}>
//                   <SVGXml icon={AppIcons.google_pay} width={20} height={20} />
//                 </View>
//               }
//             />
//           </View>

//           <LineBreak space={2} />

//           {Platform.OS === 'ios' && (
//             <View>
//               <AppButton
//                 title={'Continue with Apple'}
//                 btnBackgroundColor={AppColors.WHITE}
//                 textColor={AppColors.BLACK}
//                 textSize={1.8}
//                 borderWidth={1}
//                 btnPadding={15}
//                 borderColor={AppColors.DARKGRAY}
//                 btnWidth={90}
//                 borderRadius={10}
//                 leftIcon={
//                   <View style={{paddingHorizontal: responsiveWidth(2)}}>
//                     <SVGXml
//                       icon={AppIcons.black_apple}
//                       width={20}
//                       height={20}
//                     />
//                   </View>
//                 }
//               />
//             </View>
//           )}

//           <LineBreak space={4} />

//           <View style={{flexDirection: 'row', gap: 20, alignItems: 'center'}}>
//             <View
//               style={{
//                 backgroundColor: AppColors.GRAY,
//                 width: responsiveWidth(37),
//                 height: responsiveHeight(0.1),
//               }}
//             />
//             <AppText
//               title={'or'}
//               textAlignment={'center'}
//               textColor={AppColors.GRAY}
//               textSize={2}
//             />
//             <View
//               style={{
//                 backgroundColor: AppColors.GRAY,
//                 width: responsiveWidth(37),
//                 height: responsiveHeight(0.1),
//               }}
//             />
//           </View>
//           <LineBreak space={4} />
//           <AppButton
//             title={'Sign in with password'}
//             handlePress={() => navigateToRoute('Login')}
//             textSize={1.8}
//             btnPadding={18}
//             btnWidth={90}
//           />
//           <LineBreak space={4} />

//           <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
//             <AppText
//               title={'Don’t have an account?'}
//               textAlignment={'center'}
//               textColor={AppColors.GRAY}
//               textSize={2}
//             />
//             <TouchableOpacity onPress={() => navigateToRoute('SignUp')}>
//               <AppText
//                 title={'Sign up'}
//                 textAlignment={'center'}
//                 textColor={AppColors.BTNCOLOURS}
//                 textSize={2}
//                 textFontWeight
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//       </View>
//     </ScreenWrapper>
//   );
// };

// export default GetStarted;
