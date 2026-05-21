import React, {useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Auth, {CreateProfileRoute} from './Auth';
import Main from './Main';
import Toast from 'react-native-toast-message';
import {useSelector} from 'react-redux';
import SetLocation from '../screens/auth/AccountSetup/SetLocation';
import EnterAddressManually from '../screens/main/MapCommonScreens/EnterAddressManually';
import OnBoarding from '../screens/auth/OnBoarding';
import Splash from '../screens/auth/Splash';

import BuildYourList from '../screens/auth/AccountSetup/BuildYourList';
import SearchForPlaces from '../screens/auth/AccountSetup/SearchForPlaces';
import BrowseCategories from '../screens/auth/AccountSetup/BrowseCategories';
import MyLikes from '../screens/main/Journal/MyLikes';
import MyHates from '../screens/main/Journal/MyHates';
import HomeDetails from '../screens/main/HomeDetails';
import WishList from '../screens/main/WishList';

const Stack = createStackNavigator();
const Routes = () => {
  const [showSplash, setShowSplash] = useState(true);
  const token = useSelector(state => state?.user?.token);
  const userData = useSelector(state => state?.user?.userData);
  const current_location = useSelector(state => state?.user?.current_location);
  const isFirstTime = useSelector(state => state?.user?.isFirstTime);
  const isListBuilt = useSelector(state => state?.user?.isListBuilt);
  console.log('Token:-', token);

  return (
    <>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {showSplash ? (
          <Stack.Screen name="Splash">
            {props => (
              <Splash
                {...props}
                onComplete={() => {
                  setShowSplash(false);
                }}
              />
            )}
          </Stack.Screen>
        ) : isFirstTime ? (
          <Stack.Screen name="OnBoarding" component={OnBoarding} />
        ) : token ? (
          <>
            {userData?.isCreated ? (
              <>
                {current_location?.latitude ? (
                  <>
                    {isListBuilt ? (
                      <Stack.Screen name="Main" component={Main} />
                    ) : (
                      <>
                        <Stack.Screen
                          name="BuildYourList"
                          component={BuildYourList}
                        />
                        <Stack.Screen
                          name="SearchForPlaces"
                          component={SearchForPlaces}
                        />
                        <Stack.Screen
                          name="BrowseCategories"
                          component={BrowseCategories}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Stack.Screen name="SetLocation" component={SetLocation} />
                )}
              </>
            ) : (
              <Stack.Screen
                name="CreateProfileRoute"
                component={CreateProfileRoute}
              />
            )}
          </>
        ) : (
          <Stack.Screen name="Auth" component={Auth} />
        )}
        <Stack.Screen
          name="EnterAddressManually"
          component={EnterAddressManually}
        />
        <Stack.Screen name="MyLikes" component={MyLikes} />
        <Stack.Screen name="MyHates" component={MyHates} />
        <Stack.Screen name="WishList" component={WishList} />
        <Stack.Screen name="HomeDetails" component={HomeDetails} />
      </Stack.Navigator>
      <Toast />
    </>
  );
};

export default Routes;
