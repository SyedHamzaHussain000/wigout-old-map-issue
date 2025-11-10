import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Auth, { CreateProfileRoute } from './Auth';
import Main from './Main';
import Toast from 'react-native-toast-message';
import {useDispatch, useSelector} from 'react-redux';
import {GetCurrentLocation} from '../GlobalFunctions/other/GetCurrentLocation';
import {setCurrentLocation} from '../redux/Slices';
import LatLngIntoAddress from '../GlobalFunctions/other/LatLngIntoAddress';
import FetchNearbyPlaces from '../ApiCalls/Main/FetchNearbyPlaces';

const Stack = createStackNavigator();
const Routes = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state?.user?.token);
  const userData = useSelector((state) => state?.user?.userData);
  const current_location = useSelector((state) => state?.user?.current_location);

  

  return (
    <>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {token ? (
          <>
            {userData?.isCreated == true ? (
              <Stack.Screen name="Main" component={Main} />
            ) : (
              <Stack.Screen name="CreateProfileRoute" component={CreateProfileRoute} />
            )}
          </>
        ) : (
          <Stack.Screen name="Auth" component={Auth} />
        )}
      </Stack.Navigator>
      <Toast />
    </>
  );
};

export default Routes;
