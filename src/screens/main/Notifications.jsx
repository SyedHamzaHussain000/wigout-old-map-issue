import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  getAllNotifications,
  readAllNotifications,
} from '../../GlobalFunctions/main';
import LineBreak from '../../components/LineBreak';
import AppHeader from '../../components/AppHeader';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppColors from '../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import AppText from '../../components/AppTextComps/AppText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

const Notifications = ({navigation}) => {
  // Use optional chaining for safety
  const token = useSelector(state => state?.user?.token);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load effect
  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!loading && !refreshing && notifications?.length > 0) {
      _readAllNotifications();
    }
  }, [notifications]);

  const _readAllNotifications = async () => {
    if (!token) return;

    try {
      const response = await readAllNotifications(token);
      if (response?.success) {
        console.log('Read All Notifications API Response:-', response);
      } else {
        console.error('Failed to read all notifications:', response?.message);
      }
    } catch (error) {
      console.error('Error reading all notifications:', error);
    }
  };

  // Memoized fetch function to prevent unnecessary re-creations
  const fetchNotifications = useCallback(
    async (isRefreshing = false) => {
      if (!token) return;

      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getAllNotifications(token);
        if (response?.success) {
          console.log('Notifications API Response:-', response);
          // Ensure we always have an array
          setNotifications(Array.isArray(response.data) ? response.data : []);
        } else {
          console.error('Failed to fetch notifications:', response?.message);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  const onRefresh = () => {
    fetchNotifications(true);
  };

  const renderNotificationIcon = () => (
    <View style={styles.iconContainer}>
      <Ionicons
        name={'notifications'}
        size={responsiveFontSize(2.2)}
        color={AppColors.BTNCOLOURS}
      />
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <AppText
        title={'No Notifications'}
        textColor={AppColors.BLACK}
        textSize={2.2}
        textFontWeight
        textAlignment={'center'}
      />
      <LineBreak space={1} />
      <AppText
        title={'You have no notifications yet.'}
        textColor={AppColors.blackOpacity}
        textSize={1.8}
        textAlignment={'center'}
      />
    </View>
  );

  const handleNavigation = item => {
    console.log('item of handleNavigation :->', item);

    if (item?.metadata?.type === 'shared_listing') {
      navigation.navigate('SharedList', {data: item});
      return;
    }

    if (item?.metadata?.type === 'NewPlace') {
      navigation.navigate('HomeDetails', {
        placeDetails: {
          placeId: item?.placeId,
        },
        isFromWelcomeBack: false,
        isFromAvoid: false,
      });
      return;
    }
    if (item?.metadata?.type === 'Go Again') {
      navigation.navigate('HomeDetails', {
        placeDetails: {
          placeId: item?.placeId,
        },
        isFromWelcomeBack: true,
        isFromAvoid: false,
      });
      return;
    }

    if (item?.metadata?.type === 'Avoid') {
      navigation.navigate('HomeDetails', {
        placeDetails: {
          placeId: item?.placeId,
        },
        isFromWelcomeBack: false,
        isFromAvoid: true,
      });
      return;
    }

    // Try to get placeId from different possible fields
    // const placeId =
    //   item?.placeId || item?.metadata?.placeId || item?.metadata?.place_id;

    // if (placeId) {
    //   const isAvoid = item?.reviewId?.actionType === 'Avoid';
    //   console.log('isAvoid:-', isAvoid);
    //   navigation.navigate('HomeDetails', {
    //     placeDetails: {
    //       placeId: placeId,
    //     },
    //     // If it's avoid, trigger avoid animation. If not, trigger go again animation.
    //     isFromWelcomeBack: !isAvoid,
    //     isFromAvoid: isAvoid,
    //   });
    // }
  };

  return (
    <ScreenWrapper>
      <View style={{flex: 1}}>
        <AppHeader onBackPress={true} heading={'Notification'} />
        <LineBreak space={3} />

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item, index) =>
              item?.id?.toString() || index.toString()
            }
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={
              notifications.length === 0 ? {flex: 1} : {paddingBottom: 20}
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[AppColors.BTNCOLOURS]} // Android
                tintColor={AppColors.BTNCOLOURS} // iOS
              />
            }
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => handleNavigation(item)}
                style={styles.notificationItem(item?.read)}>
                <View style={styles.row}>
                  {renderNotificationIcon()}
                  <View style={styles.textContainer}>
                    <AppText
                      title={item.title || 'Notification'}
                      textColor={AppColors.BLACK}
                      textSize={2.1}
                      textFontWeight
                    />
                    <AppText
                      title={
                        item.created_at
                          ? moment(item.created_at).format(
                              'DD MMM, YYYY | hh:mm A',
                            )
                          : moment().format('DD MMM, YYYY | hh:mm A')
                      }
                      textColor={AppColors.blackOpacity}
                      textSize={1.4}
                    />
                  </View>
                </View>
                <LineBreak space={1} />
                <AppText
                  title={item.message || item.description || ''}
                  textColor={AppColors.BLACK}
                  textSize={1.6}
                  lineHeight={2.2}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveWidth(20),
  },
  notificationItem: read => ({
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveWidth(1.5),
    borderBottomWidth: 0.6,
    borderBottomColor: '#f2f1fe',
    backgroundColor: read ? 'transparent' : AppColors.menuBg,
  }),
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  iconContainer: {
    backgroundColor: '#f2f1fe',
    padding: responsiveWidth(3.5),
    borderRadius: 30,
  },
  textContainer: {
    flex: 1,
  },
});

export default Notifications;
