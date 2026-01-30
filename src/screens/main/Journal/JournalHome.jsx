/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import AppTextInput from '../../../components/AppTextInput';
import LineBreak from '../../../components/LineBreak';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {baseUrl} from '../../../utils/api_content';
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {useCustomNavigation} from '../../../utils/Hooks';
import AppButton from '../../../components/AppButton';
import {useState, useEffect} from 'react'; // Added useState and useEffect imports

const JournalHome = ({navigation}) => {
  const {navigateToRoute} = useCustomNavigation();
  const userData = useSelector(state => state.user.userData);
  const token = useSelector(state => state.user.token);
  const [counts, setCounts] = useState({likes: 0, hates: 0});
  const [likesData, setLikesData] = useState([]);
  const [hatesData, setHatesData] = useState([]);
  const [loader, setLoader] = useState(false);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchListDetails();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchListDetails = async () => {
    setLoader(true);
    const response = await GetReviews(token);
    if (response?.reviews) {
      const likedPlaces = response.reviews.filter(
        res => res.actionType === 'Go Again',
      );
      const hatedPlaces = response.reviews.filter(
        res => res.actionType === 'Avoid',
      );
      setLikesData(likedPlaces);
      setHatesData(hatedPlaces);
      setCounts({likes: likedPlaces.length, hates: hatedPlaces.length});
    }
    setLoader(false);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Image
              source={{uri: `${baseUrl}/${userData?.profileImage}`}}
              style={styles.profileImage}
            />
            <View>
              <AppText
                title={'Good Morning 👋'}
                textColor={AppColors.GRAY}
                textSize={1.6}
              />
              <AppText
                title={userData?.fullName || 'User'}
                textColor={AppColors.BLACK}
                textSize={2.2}
                textFontWeight
              />
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={AppColors.BLACK}
            />
          </TouchableOpacity>
        </View>

        <LineBreak space={3} />

        {/* Search Bar */}
        <AppTextInput
          inputPlaceHolder={'Track your experiences'}
          inputWidth={80}
          logo={<Ionicons name="search" size={20} color={AppColors.GRAY} />}
          rightIcon={
            <MaterialIcons name="tune" size={20} color={AppColors.BTNCOLOURS} />
          }
        />

        <LineBreak space={4} />

        {/* Like/Hate Cards */}
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={[styles.card, {backgroundColor: '#E8F5E9'}]}
            onPress={() => navigateToRoute('MyLikes', {likesData: likesData})}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="heart-outline" size={24} color="#4CAF50" />
            </View>
            <AppText
              title={'My Likes'}
              textColor={AppColors.BLACK}
              textSize={1.8}
              textFontWeight
            />
            <AppText
              title={`${counts.likes} places`}
              textColor={AppColors.GRAY}
              textSize={1.4}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, {backgroundColor: '#FFEBEE'}]}
            onPress={() => navigateToRoute('MyHates', {hatesData: hatesData})}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="thumbs-down-outline" size={24} color="#F44336" />
            </View>
            <AppText
              title={'My Hates'}
              textColor={AppColors.BLACK}
              textSize={1.8}
              textFontWeight
            />
            <AppText
              title={`${counts.hates} places`}
              textColor={AppColors.GRAY}
              textSize={1.4}
            />
          </TouchableOpacity>
        </View>

        <LineBreak space={4} />

        {/* Help Me Decide Button */}
        <AppButton
          title={'Help Me Decide'}
          handlePress={() => navigateToRoute('HelpMeDecide')}
          btnBackgroundColor={AppColors.BTNCOLOURS}
          btnWidth={90}
          leftIcon={
            <Ionicons
              name="color-wand-outline"
              size={20}
              color={AppColors.WHITE}
              style={{marginRight: 10}}
            />
          }
        />

        <LineBreak space={4} />

        {/* Reminder Card */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderIconContainer}>
            <Ionicons name="time-outline" size={24} color="#E57373" />
          </View>
          <View style={{flex: 1, marginLeft: 12}}>
            <AppText
              title={'Reminder'}
              textColor={AppColors.BLACK}
              textSize={1.8}
              textFontWeight
            />
            <AppText
              title={'Did you visit somewhere new recently?'}
              textColor={AppColors.GRAY}
              textSize={1.4}
            />
          </View>
        </View>

        <LineBreak space={4} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: responsiveHeight(2),
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.LIGHTGRAY,
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.LIGHTGRAY,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: responsiveWidth(43),
    padding: 15,
    borderRadius: 20,
    gap: 8,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 20,
    borderRadius: 20,
  },
  reminderIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFCDD2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default JournalHome;
