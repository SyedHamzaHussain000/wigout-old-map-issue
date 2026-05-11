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
  StatusBar,
} from 'react-native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import LineBreak from '../../../components/LineBreak';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import AppImages from '../../../assets/images/AppImages';
import AppButton from '../../../components/AppButton';
import {useSelector} from 'react-redux';
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {GetWishList} from '../../../ApiCalls/Main/WishList_API/WishListAPI';
import {
  Google_Places_Images,
  Google_Base_Url,
  Google_API_KEY,
} from '../../../utils/api_content';

const HelpMeDecide = () => {
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [customOption, setCustomOption] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [goAgainItems, setGoAgainItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Reuse your existing logic for image sourcing
  const getImageSource = item => {
    // 1. Direct image string (can be URL or Reference)
    const directImage =
      item.image || item.restaurantImage || item.restaurant_image;
    if (
      directImage &&
      typeof directImage === 'string' &&
      directImage.length > 5
    ) {
      const cleanImage = directImage.replace(/\s/g, '');
      if (cleanImage.startsWith('http')) return {uri: cleanImage};
      return {uri: `${Google_Places_Images}${encodeURIComponent(cleanImage)}`};
    }

    // 2. Photos array or photo reference fields
    const photo =
      (typeof item.photos?.[0] === 'string'
        ? item.photos[0]
        : item.photos?.[0]?.photo_reference) ||
      item.photo ||
      item.photo_reference ||
      item.photoReference ||
      item.photo_url ||
      item.photoUrl;

    if (photo && typeof photo === 'string' && photo.length > 5) {
      const cleanPhoto = photo.replace(/\s/g, '');
      if (cleanPhoto.startsWith('http')) return {uri: cleanPhoto};
      return {uri: `${Google_Places_Images}${encodeURIComponent(cleanPhoto)}`};
    }

    return AppImages.resturant;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customOption.trim().length > 2) handleSearch();
      else setSuggestions([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [customOption]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wishlistRes, reviewsRes] = await Promise.all([
        GetWishList(token),
        GetReviews(token),
      ]);
      if (wishlistRes?.success) setWishlistItems(wishlistRes.wishLists || []);
      if (reviewsRes?.reviews) {
        setGoAgainItems(
          reviewsRes.reviews.filter(res => res.actionType === 'Go Again'),
        );
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToSpinner = (item, type) => {
    if (selectedOptions.some(option => option.id === item._id)) return;
    const newOption = {
      id: item._id,
      name: item.name || item.restaurantName,
      category: type,
      image: getImageSource(item),
    };
    setSelectedOptions([...selectedOptions, newOption]);
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const url = `${Google_Base_Url}place/textsearch/json?query=${encodeURIComponent(
        customOption,
      )}&key=${Google_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      setSuggestions(data.results?.slice(0, 3) || []);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSuggestion = place => {
    if (selectedOptions.some(option => option.id === place.place_id)) {
      Alert.alert('Info', 'This place is already added.');
      return;
    }
    setSelectedOptions([
      ...selectedOptions,
      {
        id: place.place_id,
        name: place.name,
        category: place?.types?.[0] || 'Found Place',
        image: getImageSource(place),
      },
    ]);
    setCustomOption('');
    setSuggestions([]);
  };

  // const handleDecideForMe = () => {
  //   const combinedAll = [...wishlistItems, ...goAgainItems];
  //   if (combinedAll.length < 2) {
  //     Alert.alert('Info', 'You need at least 2 places to use auto-decide.');
  //     return;
  //   }
  //   const shuffled = [...combinedAll].sort(() => 0.5 - Math.random());
  //   const options = shuffled
  //     .slice(0, Math.min(shuffled.length, 6))
  //     .map(item => ({
  //       id: item._id,
  //       name: item.name || item.restaurantName,
  //       category: wishlistItems.some(w => w._id === item._id)
  //         ? 'Saved Place'
  //         : 'Liked Place',
  //       image: getImageSource(item),
  //     }));
  //   navigateToRoute('SpinTheWheel', {options});
  // };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* Header Section */}
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
            <View style={{width: 32}} />
          </View>

          <AppText
            title={'Select places from your likes or add custom options'}
            textColor={AppColors.blackOpacity}
            textSize={1.4}
            paddingHorizontal={7}
          />

          <LineBreak space={2} />

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}>
            {/* Custom Input Card */}
            <View style={styles.inputCard}>
              <AppText
                title={'Add custom option:'}
                textColor={AppColors.BLACK}
                textSize={1.6}
                textFontWeight
              />
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter option name"
                  placeholderTextColor={AppColors.GRAY}
                  value={customOption}
                  onChangeText={setCustomOption}
                />
                {customOption.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setCustomOption('');
                      setSuggestions([]);
                    }}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={AppColors.GRAY}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestions Overlay */}
              {(customOption.trim().length > 2 || searchLoading) && (
                <View style={styles.suggestionBox}>
                  {searchLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={AppColors.BTNCOLOURS}
                      style={{padding: 15}}
                    />
                  ) : (
                    <>
                      {suggestions.length > 0 ? (
                        suggestions.map(item => (
                          <TouchableOpacity
                            key={item.place_id}
                            style={styles.suggestionRow}
                            onPress={() => selectSuggestion(item)}>
                            <Image
                              source={getImageSource(item)}
                              style={styles.miniImg}
                            />
                            <View style={{flex: 1}}>
                              <AppText
                                title={item.name}
                                textColor={AppColors.BLACK}
                                textSize={1.3}
                                textFontWeight
                              />
                              <AppText
                                title={item?.types?.[0] || 'Place'}
                                textColor={AppColors.GRAY}
                                textSize={1.1}
                                textTransform="capitalize"
                              />
                            </View>
                            <Ionicons
                              name="add-circle"
                              size={22}
                              color={AppColors.BTNCOLOURS}
                            />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={{padding: 15, alignItems: 'center'}}>
                          <AppText
                            title="No results found"
                            textColor={AppColors.blackOpacity}
                            textSize={1.3}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>

            <LineBreak space={2} />
            <AppText
              title={`Your selected options (${selectedOptions.length}):`}
              textColor={AppColors.BLACK}
              textSize={1.6}
              textFontWeight
            />
            {selectedOptions.length === 0 && (
              <AppText
                title="No options selected yet."
                textColor={AppColors.blackOpacity}
                textSize={1.4}
                style={{marginTop: 5}}
              />
            )}

            {selectedOptions.map(item => (
              <View key={item.id} style={styles.listItem}>
                <Image source={item.image} style={styles.listImg} />
                <View style={{flex: 1}}>
                  <AppText
                    title={item.name}
                    textColor={AppColors.BLACK}
                    textSize={1.6}
                    textFontWeight
                  />
                  <AppText
                    title={item.category}
                    textColor={AppColors.blackOpacity}
                    textSize={1.2}
                    textTransform={'capitalize'}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedOptions(
                      selectedOptions.filter(o => o.id !== item.id),
                    )
                  }>
                  <MaterialIcons
                    name="delete-outline"
                    size={22}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            ))}

            <LineBreak space={3} />
            <AppText
              title="Choose from your Wishlist:"
              textColor={AppColors.BLACK}
              textSize={1.6}
              textFontWeight
            />
            <LineBreak space={1} />
            {loading ? (
              <ActivityIndicator
                size="large"
                color={AppColors.BTNCOLOURS}
                style={{marginTop: 30}}
              />
            ) : (
              <>
                {wishlistItems.length === 0 && (
                  <AppText
                    title="No items in wishlist yet."
                    textColor={AppColors.blackOpacity}
                    textSize={1.4}
                  />
                )}
                {wishlistItems.map(item => {
                  const isSelected = selectedOptions.some(
                    opt => opt.id === item._id,
                  );
                  return (
                    <View key={item._id} style={styles.listItem}>
                      <Image
                        source={getImageSource(item)}
                        style={styles.listImg}
                      />
                      <View style={{flex: 1}}>
                        <AppText
                          title={item.name || item.restaurantName}
                          textColor={AppColors.BLACK}
                          textSize={1.6}
                          textFontWeight
                        />
                        <AppText
                          title="Saved Place"
                          textColor={AppColors.blackOpacity}
                          textSize={1.2}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.addBtn,
                          isSelected && {backgroundColor: AppColors.GRAY},
                        ]}
                        disabled={isSelected}
                        onPress={() => addToSpinner(item, 'Saved Place')}>
                        <AppText
                          title={isSelected ? 'Added' : 'Add'}
                          textColor={AppColors.WHITE}
                          textSize={1.3}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <LineBreak space={3} />
                <AppText
                  title="Choose from your Go Again list:"
                  textColor={AppColors.BLACK}
                  textSize={1.6}
                  textFontWeight
                />
                <LineBreak space={1} />
                {goAgainItems.length === 0 && (
                  <AppText
                    title="No liked places yet."
                    textColor={AppColors.blackOpacity}
                    textSize={1.4}
                  />
                )}
                {goAgainItems.map(item => {
                  const isSelected = selectedOptions.some(
                    opt => opt.id === item._id,
                  );
                  return (
                    <View key={item._id} style={styles.listItem}>
                      <Image
                        source={getImageSource(item)}
                        style={styles.listImg}
                      />
                      <View style={{flex: 1}}>
                        <AppText
                          title={item.restaurantName || item.name}
                          textColor={AppColors.BLACK}
                          textSize={1.6}
                          textFontWeight
                        />
                        <AppText
                          title="Liked Place"
                          textColor={AppColors.blackOpacity}
                          textSize={1.2}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.addBtn,
                          isSelected && {backgroundColor: AppColors.GRAY},
                        ]}
                        disabled={isSelected}
                        onPress={() => addToSpinner(item, 'Liked Place')}>
                        <AppText
                          title={isSelected ? 'Added' : 'Add'}
                          textColor={AppColors.WHITE}
                          textSize={1.3}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
            <View style={{height: 120}} />
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              title={'Spin the Wheel!'}
              handlePress={() => {
                if (selectedOptions.length < 2)
                  return Alert.alert('Info', 'Select at least 2 options.');
                navigateToRoute('SpinTheWheel', {options: selectedOptions});
              }}
              btnBackgroundColor={AppColors.BTNCOLOURS}
              btnWidth={90}
              leftIcon={
                <Ionicons
                  name="aperture"
                  size={22}
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
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  sparkleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scrollBody: {paddingHorizontal: 20, paddingBottom: 20},
  inputCard: {
    backgroundColor: AppColors.menuBg,
    padding: 15,
    borderRadius: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.menuBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    height: 45,
  },
  textInput: {flex: 1, color: AppColors.BLACK, fontSize: 14},
  suggestionBox: {
    marginTop: 10,
    backgroundColor: AppColors.menuBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.inputBorder,
  },
  miniImg: {width: 32, height: 32, borderRadius: 6, marginRight: 10},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.inputBorder,
  },
  listImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  addBtn: {
    backgroundColor: AppColors.BTNCOLOURS,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default HelpMeDecide;
