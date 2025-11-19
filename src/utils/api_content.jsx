import Toast from "react-native-toast-message";

// export const Google_API_KEY = 'AIzaSyCSvL6YkmN2Bx3xDlEFVZ5VnxGWWEtslqw';
  export const Google_API_KEY = 'AIzaSyCBBEEmwSoNBnAP64faiQfNAqOiGQuFRKs';
  export const Google_Base_Url = "https://maps.googleapis.com/maps/api/"
  export const Google_Places_Images = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&key=${Google_API_KEY}&photo_reference=`

export const baseUrl = 'https://appsdemo.pro/WIGOut-Backend';

export const endPoints = {
  signUp: '/api/user/signup',
  verifyOtp: '/api/user/verifyOTP',
  resendOtp: '/api/user/resendOtp',
  createProfile: '/api/user/updateUser',
  resetPassword: '/api/user/resetPassword',
  forgotPassword: '/api/user/forgetPassword',
  signIn: '/api/user/login',
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