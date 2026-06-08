import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Utils & Theme
import {
  responsiveFontSize,
  responsiveHeight,
} from '../utils/Responsive_Dimensions';
import AppColors from '../utils/AppColors';

// Icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Foundation from 'react-native-vector-icons/Foundation';

// Screens
import Home from '../screens/main/Home';
import HomeDetails from '../screens/main/HomeDetails';
import Discover from '../screens/main/Discover/Discover';
import JournalHome from '../screens/main/Journal/JournalHome';
import TopRated from '../screens/main/TopRated/TopRates';
import Profile from '../screens/main/Profile/Profile';
import Notifications from '../screens/main/Notifications';
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
import ListViewDetail from '../screens/main/Lists/ListViewDetail';
import HelpMeDecide from '../screens/main/Journal/HelpMeDecide';
import SpinTheWheel from '../screens/main/Journal/SpinTheWheel';
import WishList from '../screens/main/WishList';
import BrowseCategories from '../screens/auth/AccountSetup/BrowseCategories';
import BuildYourList from '../screens/auth/AccountSetup/BuildYourList';
import SearchForPlaces from '../screens/auth/AccountSetup/SearchForPlaces';
import Visited from '../screens/main/Journal/Visited';
import Reminder from '../screens/main/Profile/Reminder';
import CreateReminder from '../screens/main/Profile/CreateReminder';
import PremiumUsers from '../screens/main/Profile/PremiumUsers';
import SharedList from '../screens/main/SharedList';
import CustomerService from '../screens/main/Profile/CustomerService';
import Subscriptions from '../screens/main/Profile/Subscriptions';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const IOS = Platform.OS === 'ios';

/** * Configuration for Tab Icons to keep the component clean
 */
const TAB_CONFIG = {
  Home: {
    lib: Ionicons,
    focused: 'home',
    unfocused: 'home-outline',
  },
  'Build List': {
    lib: MaterialIcons,
    focused: 'list-alt',
    unfocused: 'list-alt',
  },
  Explore: {
    lib: MaterialIcons,
    focused: 'manage-search',
    unfocused: 'manage-search',
  },
  'Local Faves': {
    lib: Foundation,
    focused: 'clipboard-notes',
    unfocused: 'clipboard-notes',
  },
  Profile: {
    lib: Ionicons,
    focused: 'person',
    unfocused: 'person-outline',
  },
};

const MyTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AppColors.WHITE,
        tabBarLabelStyle: { fontSize: responsiveFontSize(1.4) },
        tabBarStyle: {
          height: responsiveHeight(10),
          paddingTop: responsiveHeight(1.5),
          backgroundColor: AppColors.BTNCOLOURS,
          marginTop: -responsiveHeight(IOS ? 4 : 2.4),
        },
        tabBarIcon: ({ focused, color, size }) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const IconComponent = config.lib;
          const iconName = focused ? config.focused : config.unfocused;

          return <IconComponent name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={JournalHome} />
      {/* <Tab.Screen name="Discover" component={Discover} /> */}
      <Tab.Screen
        name="Build List"
        component={BuildYourList}
        initialParams={{ isFromTab: true }}
      />
      <Tab.Screen name="Explore" component={Home} />
      <Tab.Screen name="Local Faves" component={TopRated} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const Main = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MyTabs} />

      {/* Grouping related screens mentally makes this easier to manage */}
      <Stack.Screen name="Notifications" component={Notifications} />

      {/* Profile Related */}
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettings}
      />
      <Stack.Screen name="Payments" component={Payments} />
      <Stack.Screen name="LinkedAccounts" component={LinkedAccounts} />
      <Stack.Screen name="Security" component={Security} />
      <Stack.Screen name="Language" component={Language} />
      <Stack.Screen name="HelpCenter" component={HelpCenter} />
      <Stack.Screen name="InviteFriends" component={InviteFriends} />
      <Stack.Screen name="VisitHistory" component={VisitHistory} />

      {/* Location/Other */}
      <Stack.Screen name="SetLocation" component={SetLocation} />
      <Stack.Screen
        name="EnterAddressManually"
        component={EnterAddressManually}
      />
      <Stack.Screen name="ListViewDetail" component={ListViewDetail} />
      <Stack.Screen name="HelpMeDecide" component={HelpMeDecide} />
      <Stack.Screen name="SpinTheWheel" component={SpinTheWheel} />
      <Stack.Screen name="WishList" component={WishList} />
      <Stack.Screen name="BrowseCategories" component={BrowseCategories} />
      <Stack.Screen name="BuildYourList" component={BuildYourList} />
      <Stack.Screen name="SearchForPlaces" component={SearchForPlaces} />
      <Stack.Screen name="Visited" component={Visited} />
      <Stack.Screen name="Reminder" component={Reminder} />
      <Stack.Screen name="CreateReminder" component={CreateReminder} />
      <Stack.Screen name="PremiumUsers" component={PremiumUsers} />
      <Stack.Screen name="SharedList" component={SharedList} />
      <Stack.Screen name="CustomerService" component={CustomerService} />
      <Stack.Screen name="Subscriptions" component={Subscriptions} />
    </Stack.Navigator>
  );
};

export default Main;
