/* eslint-disable quotes */
/* eslint-disable eqeqeq */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import BackgroundScreen from '../../../components/AppTextComps/BackgroundScreen';
import AppHeader from '../../../components/AppHeader';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import AppImages from '../../../assets/images/AppImages';
import LineBreak from '../../../components/LineBreak';
import BioCard from '../../../components/BioCard';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import LogoutModal from '../../../components/LogoutModal';
import {useDispatch, useSelector} from 'react-redux';
import {clearToken} from '../../../redux/Slices';
import { baseUrl } from '../../../utils/api_content';
import { userData } from './../../../utils/LocalData';

const iconSize = responsiveFontSize(2.5);
const arrowSize = responsiveFontSize(3);
const commonIconColor = AppColors.BLACK;

const renderIcon = (
  IconComponent,
  name,
  size = iconSize,
  color = commonIconColor,
) => <IconComponent name={name} size={size} color={color} />;

const rightArrow = (
  <Entypo name="chevron-small-right" size={arrowSize} color={commonIconColor} />
);

const secondProfileMenus = [
  {
    id: 1,
    icon: renderIcon(AntDesign, 'user', responsiveFontSize(2.2)),
    title: 'Profile',
    rightArrow,
    navTo: 'EditProfile',
  },
  {
    id: 2,
    icon: renderIcon(AntDesign, 'bells'),
    title: 'Notification',
    rightArrow,
    navTo: 'NotificationsSettings',
  },
  {
    id: 3,
    icon: renderIcon(AntDesign, 'wallet'),
    title: 'Payments',
    rightArrow,
    navTo: 'Payments',
  },
  {
    id: 4,
    icon: renderIcon(Ionicons, 'swap-vertical'),
    title: 'Linked Accounts',
    rightArrow,
    navTo: 'LinkedAccounts',
  },
  {
    id: 6,
    icon: renderIcon(Octicons, 'verified'),
    title: 'Security',
    rightArrow,
    navTo: 'Security',
  },
  // {
  //   id: 7,
  //   icon: renderIcon(Entypo, 'language'),
  //   title: 'Language',
  //   languageName: 'English (US)',
  //   rightArrow,
  //   navTo: 'Language',
  // },
  // {
  //   id: 8,
  //   icon: renderIcon(Ionicons, 'eye-outline'),
  //   title: 'Dark Mode',
  //   rightArrow: renderIcon(FontAwesome6, 'toggle-off', arrowSize),
  // },
  {
    id: 9,
    icon: renderIcon(Feather, 'alert-circle'),
    title: 'Help Center',
    rightArrow,
    navTo: 'HelpCenter',
  },
  {
    id: 10,
    icon: renderIcon(FontAwesome5, 'users', responsiveFontSize(2)),
    title: 'Invite Friends',
    rightArrow,
    navTo: 'InviteFriends',
  },
  {
    id: 11,
    icon: renderIcon(FontAwesome5, 'star', responsiveFontSize(2)),
    title: 'Visit History',
    rightArrow,
    navTo: 'VisitHistory',
  },
  {
    id: 12,
    icon: renderIcon(MaterialIcons, 'logout', iconSize, AppColors.RED_COLOR),
    title: 'Logout',
  },
];

const Profile = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userData = useSelector((state: RootState) => state.user.userData);

  // useEffect(() => {
  //   dispatch(clearToken());
  // }, [])
  

  return (
    <ScrollView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <AppHeader heading={'Profile'} />

      <LineBreak space={2} />

      <View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{alignItems: 'center', gap: 15}}>
            <TouchableOpacity>
              <Image
                source={{uri: `${baseUrl}/${userData?.profileImage}`}}
                style={{width: 100, height: 100, borderRadius: 100}}
              />
            </TouchableOpacity>
            <AppText
              title={`${userData?.fullName} ${userData?.nickName}`}
              textColor={AppColors.BLACK}
              textSize={2.7}
              textFontWeight
            />
          </View>
        </View>
      </View>

      <LineBreak space={3} />

      <LogoutModal
        visible={showLogoutModal}
        handleApplyOnPress={() => {
          dispatch(clearToken());
        }}
        handleResetOnPress={() => setShowLogoutModal(false)}
      />

      <View style={{paddingHorizontal: responsiveWidth(5)}}>
        <FlatList
          data={secondProfileMenus}
          ItemSeparatorComponent={() => <LineBreak space={2} />}
          ListFooterComponent={() => <LineBreak space={2} />}
          renderItem={({item}) => {
            return (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
                onPress={() => {
                  if (item.navTo) {
                    navigation.navigate(item.navTo);
                  } else if (item.id == 12) {
                    setShowLogoutModal(true);
                  }
                }}>
                <View style={{flexDirection: 'row', gap: 15, }}>
                  {item.icon}
                  <AppText
                    title={item.title}
                    textColor={
                      item.id == 12 ? AppColors.RED_COLOR : AppColors.BLACK
                    }
                    textSize={1.7}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                  {item.languageName && (
                    <AppText
                      title={item.languageName}
                      textColor={AppColors.BLACK}
                      textSize={1.7}
                    />
                  )}
                  {item.rightArrow}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScrollView>
  );
};

export default Profile;
