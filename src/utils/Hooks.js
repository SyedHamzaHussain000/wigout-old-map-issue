import {useNavigation} from '@react-navigation/native';
import {useState, useEffect} from 'react';
import Toast from 'react-native-toast-message';

export const useCustomNavigation = () => {
  const navigation = useNavigation();

  const navigateToRoute = (routeName, params) => {
    navigation.navigate(routeName, params);
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return {
    navigateToRoute,
    goBack,
    navigation,
  };
};

export const ShowToast = message => {
  return Toast.show({
    type: 'success',
    text1: message,
  });
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
