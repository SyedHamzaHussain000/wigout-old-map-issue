/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {
  responsiveFontSize,
  responsiveHeight,
} from '../utils/Responsive_Dimensions';
import AppColors from '../utils/AppColors';
import Home from '../screens/main/Home';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Explore from '../screens/main/Explore/Explore';
import Notifications from '../screens/main/Notifications';
import HomeDetails from '../screens/main/HomeDetails';
import Favorites from '../screens/main/Favourties/Favorites';
import Profile from '../screens/main/Profile/Profile';
import Lists from '../screens/main/Lists/Lists';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import EditProfile from '../screens/main/Profile/EditProfile';
import NotificationsSettings from '../screens/main/Profile/NotificationsSettings';
import Payments from '../screens/main/Profile/Payments';
import LinkedAccounts from '../screens/main/Profile/LinkedAccounts';
import Security from '../screens/main/Profile/Security';
import Language from '../screens/main/Profile/Language';
import HelpCenter from '../screens/main/Profile/HelpCenter';
import InviteFriends from '../screens/main/Profile/InviteFriends';
import VisitHistory from '../screens/main/Profile/VisitHistory';
import SetLocation from '../screens/auth/AccountSetup/SetLocation';
import EnterAddressManually from '../screens/main/MapCommonScreens/EnterAddressManually';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const Main = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Main" component={MyTabs} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="HomeDetails" component={HomeDetails} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettings} />
      <Stack.Screen name="Payments" component={Payments} />
      <Stack.Screen name="LinkedAccounts" component={LinkedAccounts} />
      <Stack.Screen name="Security" component={Security} />
      <Stack.Screen name="Language" component={Language} />
      <Stack.Screen name="HelpCenter" component={HelpCenter} />
      <Stack.Screen name="InviteFriends" component={InviteFriends} />
      <Stack.Screen name="VisitHistory" component={VisitHistory} />

      <Stack.Screen name="SetLocation" component={SetLocation} />
      <Stack.Screen name="EnterAddressManually" component={EnterAddressManually} />
      
    </Stack.Navigator>
  );
};

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarLabelStyle: {fontSize: responsiveFontSize(1.4)},
        tabBarActiveTintColor: AppColors.WHITE,
        tabBarStyle: {
          height: responsiveHeight(10),
          // borderTopLeftRadius: 20,
          // borderTopRightRadius: 20,
          paddingTop: responsiveHeight(1.5),
          backgroundColor: AppColors.BTNCOLOURS,
        },
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Lists') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list';
          } else if (route.name === 'My Journal') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'explore' : 'explore';
          }

          if (route.name === 'Discover') {
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Lists') {
            return <FontAwesome5 name={iconName} size={size} color={color} />;
          } else {
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
      })}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Discover" component={Explore} />
      {/* <Tab.Screen name="My Journal" component={Favorites} /> */}
      <Tab.Screen name="Lists" component={Lists} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default Main;
