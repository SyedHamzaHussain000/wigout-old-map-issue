/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import LineBreak from '../../../components/LineBreak';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import AppImages from '../../../assets/images/AppImages';
import AppButton from '../../../components/AppButton';
import {useSelector} from 'react-redux';
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../../../ApiCalls/Main/WishList_API/WishListAPI';
import {Google_Places_Images} from '../../../utils/api_content';

const HelpMeDecide = () => {
  const {goBack} = useCustomNavigation();
  const {navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [customOption, setCustomOption] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [goAgainItems, setGoAgainItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wishlistRes, reviewsRes] = await Promise.all([
        GetWishList(token),
        GetReviews(token),
      ]);

      if (wishlistRes?.success) {
        setWishlistItems(wishlistRes.wishLists || []);
      }

      if (reviewsRes?.reviews) {
        const likes = reviewsRes.reviews.filter(
          res => res.actionType === 'Go Again',
        );
        setGoAgainItems(likes);
      }
    } catch (error) {
      console.log('Error fetching data in HelpMeDecide:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToSpinner = (item, type = 'Saved Place') => {
    // Check if already selected
    if (selectedOptions.some(option => option.id === item._id)) {
      return;
    }
    const newOption = {
      id: item._id,
      name: item.name || item.restaurantName,
      category: type,
      image: item.image
        ? {uri: `${Google_Places_Images}${item.image}`}
        : item.photos?.[0]
        ? item.photos[0].startsWith('http')
          ? {uri: item.photos[0]}
          : {uri: `${Google_Places_Images}${item.photos[0]}`}
        : AppImages.resturant,
      fullData: item,
    };
    setSelectedOptions([...selectedOptions, newOption]);
  };

  const addCustomOption = () => {
    if (!customOption.trim()) return;
    const newOption = {
      id: Date.now().toString(),
      name: customOption,
      category: 'Custom',
      image: AppImages.resturant,
    };
    setSelectedOptions([...selectedOptions, newOption]);
    setCustomOption('');
  };

  const handleDecideForMe = () => {
    const combinedAll = [...wishlistItems, ...goAgainItems];
    if (combinedAll.length < 2) {
      Alert.alert(
        'Info',
        'You need at least 2 saved or liked places to use "Decide for me".',
      );
      return;
    }

    // Pick random items (2 to 6)
    const shuffled = [...combinedAll].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffled.length, 6);
    const randomPick = shuffled.slice(0, count);

    const options = randomPick.map(item => ({
      id: item._id,
      name: item.name || item.restaurantName,
      category: wishlistItems.some(w => w._id === item._id)
        ? 'Saved Place'
        : 'Liked Place',
      image: item.image
        ? {uri: `${Google_Places_Images}${item.image}`}
        : item.photos?.[0]
        ? item.photos[0].startsWith('http')
          ? {uri: item.photos[0]}
          : {uri: `${Google_Places_Images}${item.photos[0]}`}
        : AppImages.resturant,
      fullData: item,
    }));

    navigateToRoute('SpinTheWheel', {options});
  };

  const removeOption = id => {
    setSelectedOptions(selectedOptions.filter(item => item.id !== id));
  };

  const renderItem = ({item}) => (
    <View style={styles.placeItem}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <Image source={item.image} style={styles.placeImage} />
        <View>
          <AppText
            title={item.name}
            textColor={AppColors.BLACK}
            textSize={1.6}
            textFontWeight
          />
          <AppText
            title={item.category}
            textColor={AppColors.GRAY}
            textSize={1.2}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => removeOption(item.id)}>
        <MaterialIcons name="delete-outline" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIcon
              onBackPress={() => goBack()}
              iconColor={AppColors.BLACK}
            />
            <AppText
              title={'Help Me Decide'}
              textColor={AppColors.BLACK}
              textSize={2.5}
              textFontWeight
            />
            <TouchableOpacity
              onPress={handleDecideForMe}
              style={styles.decideForMeHeaderBtn}>
              <Ionicons
                name="sparkles"
                size={22}
                color={AppColors.BTNCOLOURS}
              />
            </TouchableOpacity>
          </View>

          <LineBreak space={2} />
          <AppText
            title={'Select places from your likes or add custom options'}
            textColor={AppColors.GRAY}
            textSize={1.4}
            paddingHorizontal={7}
          />

          <LineBreak space={3} />

          <ScrollView
            contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 100}}
            showsVerticalScrollIndicator={false}>
            {/* Add Custom Option */}
            <View style={styles.customOptionSection}>
              <AppText
                title={'Add custom option:'}
                textColor={AppColors.BLACK}
                textSize={1.6}
                textFontWeight
              />
              <LineBreak space={1} />
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter option name"
                  placeholderTextColor={AppColors.GRAY}
                  value={customOption}
                  onChangeText={setCustomOption}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={addCustomOption}>
                  <Ionicons name="add" size={24} color={AppColors.WHITE} />
                  <AppText
                    title={'Add'}
                    textColor={AppColors.WHITE}
                    textSize={1.6}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <LineBreak space={3} />

            <AppText
              title={`Your selected options (${selectedOptions.length}):`}
              textColor={AppColors.BLACK}
              textSize={1.6}
              textFontWeight
            />
            <LineBreak space={2} />

            {selectedOptions.map(item => (
              <View key={item.id} style={styles.placeItem}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <Image source={item.image} style={styles.placeImage} />
                  <View>
                    <AppText
                      title={item.name}
                      textColor={AppColors.BLACK}
                      textSize={1.6}
                      textFontWeight
                    />
                    <AppText
                      title={item.category}
                      textColor={AppColors.GRAY}
                      textSize={1.2}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeOption(item.id)}>
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            ))}

            <LineBreak space={3} />
            <AppText
              title={'Choose from your Wishlist:'}
              textColor={AppColors.BLACK}
              textSize={1.6}
              textFontWeight
            />
            <LineBreak space={2} />

            {loading ? (
              <ActivityIndicator size="small" color={AppColors.BTNCOLOURS} />
            ) : wishlistItems.length > 0 ? (
              wishlistItems.map(item => {
                const isSelected = selectedOptions.some(
                  opt => opt.id === item._id,
                );
                return (
                  <View key={item._id} style={styles.placeItem}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                      <Image
                        source={
                          item.image
                            ? {uri: `${Google_Places_Images}${item.image}`}
                            : item.photos?.[0]
                            ? item.photos[0].startsWith('http')
                              ? {uri: item.photos[0]}
                              : {uri: `${Google_Places_Images}${item.photos[0]}`}
                            : AppImages.resturant
                        }
                        style={styles.placeImage}
                      />
                      <View>
                        <AppText
                          title={item.name || item.restaurantName}
                          textColor={AppColors.BLACK}
                          textSize={1.6}
                          textFontWeight
                        />
                        <AppText
                          title={'Saved Place'}
                          textColor={AppColors.GRAY}
                          textSize={1.2}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addBtnSmall,
                        isSelected && {backgroundColor: AppColors.GRAY},
                      ]}
                      disabled={isSelected}
                      onPress={() => addToSpinner(item, 'Saved Place')}>
                      <AppText
                        title={isSelected ? 'Added' : 'Add'}
                        textColor={AppColors.WHITE}
                        textSize={1.4}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <AppText
                title={'No items in wishlist yet.'}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            )}

            <LineBreak space={3} />
            <AppText
              title={'Choose from your Go Again list:'}
              textColor={AppColors.BLACK}
              textSize={1.6}
              textFontWeight
            />
            <LineBreak space={2} />

            {loading ? (
              <ActivityIndicator size="small" color={AppColors.BTNCOLOURS} />
            ) : goAgainItems.length > 0 ? (
              goAgainItems.map(item => {
                const isSelected = selectedOptions.some(
                  opt => opt.id === item._id,
                );
                return (
                  <View key={item._id} style={styles.placeItem}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                      <Image
                        source={
                          item.photos?.[0]
                            ? item.photos[0].startsWith('http')
                              ? {uri: item.photos[0]}
                              : {uri: `${Google_Places_Images}${item.photos[0]}`}
                            : AppImages.resturant
                        }
                        style={styles.placeImage}
                      />
                      <View>
                        <AppText
                          title={item.restaurantName || item.name}
                          textColor={AppColors.BLACK}
                          textSize={1.6}
                          textFontWeight
                        />
                        <AppText
                          title={'Liked Place'}
                          textColor={AppColors.GRAY}
                          textSize={1.2}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addBtnSmall,
                        isSelected && {backgroundColor: AppColors.GRAY},
                      ]}
                      disabled={isSelected}
                      onPress={() => addToSpinner(item, 'Liked Place')}>
                      <AppText
                        title={isSelected ? 'Added' : 'Add'}
                        textColor={AppColors.WHITE}
                        textSize={1.4}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <AppText
                title={'No liked places yet.'}
                textColor={AppColors.GRAY}
                textSize={1.4}
              />
            )}
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.bottomButtonContainer}>
            <AppButton
              title={'Spin the Wheel!'}
              handlePress={() => {
                if (selectedOptions.length < 2) {
                  Alert.alert('Info', 'Please select at least 2 options.');
                  return;
                }
                navigateToRoute('SpinTheWheel', {options: selectedOptions});
              }}
              // disabled={selectedOptions.length < 2}
              btnBackgroundColor={AppColors.BTNCOLOURS}
              btnWidth={90}
              leftIcon={
                <Ionicons
                  name="aperture-outline"
                  size={24}
                  color={AppColors.WHITE}
                  style={{marginRight: 10}}
                />
              }
            />
          </View>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: responsiveHeight(2),
  },
  customOptionSection: {
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customInput: {
    flex: 1,
    height: 45,
    backgroundColor: AppColors.WHITE,
    borderRadius: 10,
    paddingHorizontal: 15,
    color: AppColors.BLACK,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.BTNCOLOURS,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 10,
    gap: 5,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  placeImage: {
    width: 45,
    height: 45,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: AppColors.graysh,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addBtnSmall: {
    backgroundColor: AppColors.BTNCOLOURS,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  decideForMeHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HelpMeDecide;
