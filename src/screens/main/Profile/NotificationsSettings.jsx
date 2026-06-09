import React, {Fragment} from 'react';
import {FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import LineBreak from '../../../components/LineBreak';
import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import {useNavigation} from '@react-navigation/native';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {updateNotificationSettings} from '../../../redux/Slices';
import {
  startBackgroundService,
  stopBackgroundService,
} from '../../../services/BackgroundLocationService';
import {requestLocationPermission} from '../../../utils/Permissions';

const data = [
  {id: 1, title: 'Enable Sound & Vibrate', key: 'soundVibrate'},
  {id: 2, title: 'Background Location', key: 'backgroundLocation'},
  {id: 3, title: 'Recommendations', key: 'recommendations'},
];

const NotificationsSettings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const settings = useSelector(state => state.user.notificationSettings);

  const handleToggle = async (id, key) => {
    const newValue = !settings[key];

    // Specific logic for background location
    if (key === 'backgroundLocation') {
      if (newValue) {
        const permissionGranted = await requestLocationPermission();
        if (permissionGranted) {
          dispatch(updateNotificationSettings({[key]: true}));
          startBackgroundService();
        } else {
          console.log('Location permission not granted, background location remains disabled.');
        }
      } else {
        dispatch(updateNotificationSettings({[key]: false}));
        stopBackgroundService();
      }
    } else {
      dispatch(updateNotificationSettings({[key]: newValue}));
    }
  };

  const renderItem = ({item}) => {
    const isEnabled = settings[item.key];
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => handleToggle(item.id, item.key)}>
        <AppText
          title={item.title}
          textColor={AppColors.BLACK}
          textSize={1.8}
          textFontWeight="700"
        />
        <FontAwesome6
          name={isEnabled ? 'toggle-on' : 'toggle-off'}
          size={responsiveFontSize(4)}
          color={isEnabled ? AppColors.BTNCOLOURS : AppColors.LIGHTGRAY}
        />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <Fragment>
      <AppHeader
        onBackPress={() => navigation.goBack()}
        heading="Notification Settings"
      />
      <LineBreak space={4} />
    </Fragment>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <LineBreak space={3} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: responsiveHeight(5),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
  },
});

export default NotificationsSettings;
