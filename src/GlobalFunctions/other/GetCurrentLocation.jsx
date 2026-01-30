// import Geolocation from '@react-native-community/geolocation';
import Geolocation from 'react-native-geolocation-service';

import { PermissionsAndroid, Platform } from 'react-native';

export const GetCurrentLocation = async () => {
  try {
    if (Platform.OS == 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Wigout',
          message: 'Wigout want to access your location',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // console.log('granted', granted);

        return new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            pos => {
              // console.log("poosition", pos);
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            err => reject(err),
            // {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, showLocationDialog: true }
          );
        });
      } else {

        // console.log('Location permission denied');

      }
    } else {
      const whenInUse = await Geolocation.requestAuthorization('whenInUse')
      const always = await Geolocation.requestAuthorization('always')


      if (always == "granted" || whenInUse == "granted") {

        // console.log("whenInUse || always" , always, whenInUse)


        return new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            pos => {
              // console.log("poosition", pos);
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            err => reject(err),
            // {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, showLocationDialog: true }
          );
        });
      } else {
        // console.log('Location permission denied');
      }
    }
  } catch (error) {
    console.log("Error", error)
    return Promise.reject(error);
  }
};
