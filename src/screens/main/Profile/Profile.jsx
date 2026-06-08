import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import LineBreak from '../../../components/LineBreak';
import LogoutModal from '../../../components/LogoutModal';
import DeleteAccountModal from '../../../components/DeleteAccountModal';
import { clearToken } from '../../../redux/Slices';
import { baseUrl, ShowToast } from '../../../utils/api_content';
import { deleteAccount } from '../../../GlobalFunctions/auth';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';

const Profile = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const userData = useSelector(state => state.user.userData);
  const token = useSelector(state => state.user.token);

  const iconSize = responsiveFontSize(2.2);
  const arrowSize = responsiveFontSize(2.5);

  const menuItems = useMemo(
    () => [
      {
        id: 1,
        title: 'Update Profile',
        navTo: 'EditProfile',
        icon: (
          <AntDesign name="user" size={iconSize} color={AppColors.BTNCOLOURS} />
        ),
      },
      {
        id: 2,
        title: 'Reminders',
        navTo: 'Reminder',
        icon: (
          <FontAwesome5
            name="calendar"
            size={responsiveFontSize(2)}
            color={AppColors.BTNCOLOURS}
          />
        ),
      },
      {
        id: 3,
        title: 'Subscriptions',
        navTo: 'Subscriptions',
        icon: (
          <Ionicons
            name="trophy-outline"
            size={responsiveFontSize(2)}
            color={AppColors.BTNCOLOURS}
          />
        ),
      },
      // {
      //   id: 3,
      //   title: 'Build Your List',
      //   navTo: 'BuildYourList',
      //   icon: (
      //     <FontAwesome5
      //       name="star"
      //       size={responsiveFontSize(2)}
      //       color={AppColors.BTNCOLOURS}
      //     />
      //   ),
      // },
      // {
      //   id: 4,
      //   title: 'Payments',
      //   navTo: 'Payments',
      //   icon: (
      //     <AntDesign
      //       name="wallet"
      //       size={iconSize}
      //       color={AppColors.BTNCOLOURS}
      //     />
      //   ),
      // },
      // {
      //   id: 5,
      //   title: 'Linked Accounts',
      //   navTo: 'LinkedAccounts',
      //   icon: (
      //     <Ionicons
      //       name="swap-vertical"
      //       size={iconSize}
      //       color={AppColors.BTNCOLOURS}
      //     />
      //   ),
      // },
      {
        id: 6,
        title: 'Help Center',
        navTo: 'HelpCenter',
        icon: (
          <Feather
            name="alert-circle"
            size={iconSize}
            color={AppColors.BTNCOLOURS}
          />
        ),
      },
      {
        id: 7,
        title: 'Premium Users',
        navTo: 'PremiumUsers',
        icon: (
          <Ionicons
            name="people-outline"
            size={iconSize}
            color={AppColors.BTNCOLOURS}
          />
        ),
      },
      {
        id: 8,
        title: 'Notification Settings',
        navTo: 'NotificationsSettings',
        icon: (
          <AntDesign
            name="bells"
            size={iconSize}
            color={AppColors.BTNCOLOURS}
          />
        ),
      },
      {
        id: 10,
        title: 'Delete Account',
        isDelete: true,
        icon: (
          <MaterialIcons
            name="delete"
            size={iconSize}
            color={AppColors.RED_COLOR}
          />
        ),
      },
      {
        id: 9,
        title: 'Logout',
        isLogout: true,
        icon: (
          <MaterialIcons
            name="logout"
            size={iconSize}
            color={AppColors.RED_COLOR}
          />
        ),
      },
    ],
    [iconSize],
  );

  const handleMenuPress = item => {
    if (item.isLogout) {
      setShowLogoutModal(true);
    } else if (item?.isDelete) {
      setShowDeleteModal(true);
    } else if (item.navTo) {
      navigation.navigate(item.navTo);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    const res = await deleteAccount({ token });
    if (res?.success) {
      ShowToast('success', res?.msg || 'Account deleted successfully!');
      dispatch(clearToken());
    } else {
      ShowToast('error', res?.message || 'Failed to delete account.');
    }
  };

  console.log('userData:-', userData);
  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <AppHeader heading="Profile" />
        <LineBreak space={2} />

        {/* User Info Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `${baseUrl}/${userData?.profileImage}` }}
              style={styles.avatar}
            />
          </View>
          <LineBreak space={1} />
          <AppText
            title={userData?.fullName || 'User Name'}
            textColor={AppColors.BLACK}
            textSize={2.8}
            textFontWeight
          />
          {userData?.nickName && (
            <AppText
              title={`@${userData.nickName}`}
              textColor={AppColors.blackOpacity}
              textSize={1.5}
            />
          )}

          {userData?.subscription?.plan && (
            <AppText
              title={`Plan: ${userData?.subscription?.plan?.toUpperCase()}`}
              textColor={AppColors.BLACK}
              textSize={1.7}
              textTransform={'capitalize'}
            />
          )}
        </View>

        <LineBreak space={1} />

        {/* Settings Menu */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item)}>
                <View style={styles.menuLeft}>
                  <View style={styles.iconWrapper}>{item.icon}</View>
                  <AppText
                    title={item.title}
                    textColor={
                      item.isLogout
                        ? AppColors.RED_COLOR
                        : item?.isDelete
                          ? AppColors.RED_COLOR
                          : AppColors.BLACK
                    }
                    textSize={1.8}
                  />
                </View>
                {!item.isLogout && (
                  <Entypo
                    name="chevron-small-right"
                    size={arrowSize}
                    color={AppColors.GRAY}
                  />
                )}
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </View>

        <LineBreak space={3} />
      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        handleResetOnPress={() => setShowLogoutModal(false)}
        handleApplyOnPress={() => dispatch(clearToken())}
      />
      <DeleteAccountModal
        visible={showDeleteModal}
        handleResetOnPress={() => setShowDeleteModal(false)}
        handleApplyOnPress={handleDeleteAccount}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: AppColors.WHITE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuContainer: {
    marginHorizontal: responsiveWidth(5),
    backgroundColor: AppColors.menuBg,
    borderRadius: 20,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconWrapper: {
    width: 35,
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 15,
  },
});

export default Profile;
