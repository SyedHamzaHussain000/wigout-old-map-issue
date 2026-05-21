import {Platform, ToastAndroid} from 'react-native';
import Toast from 'react-native-toast-message';

const ShowError = (title, duration = ToastAndroid?.SHORT || 0) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(title, duration);
  } else {
    // Dynamically determine the toast type based on keywords
    const lowerTitle = title?.toLowerCase() || '';
    const isError = lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('wrong');
    const isSuccess = lowerTitle.includes('success') || lowerTitle.includes('added') || lowerTitle.includes('removed') || lowerTitle.includes('unblocked');
    const toastType = isError ? 'error' : isSuccess ? 'success' : 'info';

    Toast.show({
      type: toastType,
      text1: title,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  }
};

export default ShowError;
