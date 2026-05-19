import {View, Text, Platform, ToastAndroid, Alert} from 'react-native';
import React from 'react';

const ShowError = (title, duration = ToastAndroid.SHORT) => {
  if (Platform.OS == 'android') {
    ToastAndroid.show(title, duration);
  } else {
    Alert.alert(title);
    console.log('title:-', title);
    // ShowToast('info', title);
  }
};

export default ShowError;
