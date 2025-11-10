import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import OnBoarding from '../screens/auth/OnBoarding';
import GetStarted from '../screens/auth/GetStarted';
import Login from '../screens/auth/Login';
import SignUp from '../screens/auth/SignUp';
import ForgotPassword from '../screens/auth/ForgotPassword';
import OtpVerification from '../screens/auth/OtpVerification';
import CreateNewPassword from '../screens/auth/CreateNewPassword';
import FillYourProfile from '../screens/auth/AccountSetup/FillYourProfile';
import SetLocation from '../screens/auth/AccountSetup/SetLocation';
import CreateNewPin from '../screens/auth/AccountSetup/CreateNewPin';
import FaceScanning from '../screens/auth/AccountSetup/FaceScanning';
import Splash from '../screens/auth/Splash';
import EmailForForgotPassword from '../screens/auth/EmailForForgotPassword';
import EnterAddressManually from '../screens/main/MapCommonScreens/EnterAddressManually';

const Stack = createStackNavigator();
const Auth = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="OnBoarding" component={OnBoarding} />
      <Stack.Screen name="GetStarted" component={GetStarted} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="EmailForForgotPassword" component={EmailForForgotPassword} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPassword} />
      <Stack.Screen name="FillYourProfile" component={FillYourProfile} />
      <Stack.Screen name="SetLocation" component={SetLocation} />
      <Stack.Screen name="EnterAddressManually" component={EnterAddressManually} />
      <Stack.Screen name="CreateNewPin" component={CreateNewPin} />
      <Stack.Screen name="FaceScanning" component={FaceScanning} />

      
    </Stack.Navigator>
  );
};


export const CreateProfileRoute = () => (
  
  <Stack.Navigator
      initialRouteName="FillYourProfile"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="FillYourProfile" component={FillYourProfile} />
      <Stack.Screen name="SetLocation" component={SetLocation} />
      

      
    </Stack.Navigator>

)
export default Auth;
