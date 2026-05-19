import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';

// export const Google_API_KEY = 'AIzaSyBRedR6LuuBpRcW87u8vrA0KXeC3K56--s';
export const Google_API_KEY =
  Platform.OS === 'ios'
    ? 'AIzaSyC9ivcuNTxfByE1w13AtiD7oKXrY7xcoiM'
    : 'AIzaSyBRedR6LuuBpRcW87u8vrA0KXeC3K56--s';
export const Google_Base_Url = 'https://maps.googleapis.com/maps/api/';
export const Google_Places_Images = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&key=${Google_API_KEY}&photo_reference=`;

// export const baseUrl = 'https://appsdemo.pro/WIGOut-Backend';
export const baseUrl = 'https://wigout.apiforapp.link';
export const webClientId =
  '59552515763-7pfcehum5to04ag3gno1gu1an7kvb2si.apps.googleusercontent.com';
// export const webClientId =
//   '351663174027-9bfvj1am9c3gffblde070dpreubomoj7.apps.googleusercontent.com';

export const endPoints = {
  signUp: '/api/user/signup',
  verifyOtp: '/api/user/verifyOTP',
  resendOtp: '/api/user/resendOtp',
  createProfile: '/api/user/updateUser',
  resetPassword: '/api/user/resetPassword',
  forgotPassword: '/api/user/forgetPassword',
  signIn: '/api/user/login',
  socialLogin: '/api/user/socialLogin',
  addNote: '/api/user/addNoteOnReview',
  deleteNote: '/api/user/deleteNote',
  getAllNotifications: '/api/user/getNotifications',
  notifyUser: '/api/user/notifyUserForNearbyReviewedPlaces',
  deleteAccount: '/api/user/deleteAccount',
  getAllSubscribedUsers: '/api/getAllSubscribedUsers',
  shareMyListing: '/api/shareMyListing',
  getSharedListingsDetails: '/api/getSharedListingsDetails',
  readAllNotifications: '/api/user/readAllNotifications',
};

export const ShowToast = (type: 'success' | 'error' | 'info', message) => {
  Toast.show({
    type: type,
    text1: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};
