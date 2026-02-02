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

const HelpMeDecide = () => {
  const {goBack} = useCustomNavigation();
  const {navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [customOption, setCustomOption] = useState('');
  const [myLikes, setMyLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    fetchMyLikes();
  }, []);

  const fetchMyLikes = async () => {
    setLoading(true);
    const response = await GetReviews(token);
    if (response?.reviews) {
      const likedPlaces = response.reviews.filter(
        res => res.actionType === 'Go Again',
      );
      setMyLikes(likedPlaces);
    }
    setLoading(false);
  };

  const addToSpinner = item => {
    // Check if already selected
    if (selectedOptions.some(option => option.id === item._id)) {
      return;
    }
    const newOption = {
      id: item._id,
      name: item.restaurantName,
      category: 'Saved Place',
      image: item.photos?.[0] ? {uri: item.photos[0]} : AppImages.resturant,
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
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
          <AppText
            title={'Help Me Decide'}
            textColor={AppColors.BLACK}
            textSize={2.5}
            textFontWeight
          />
          <View style={{width: 40}} />
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
              <TouchableOpacity style={styles.addBtn} onPress={addCustomOption}>
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
            title={'Choose from your likes:'}
            textColor={AppColors.BLACK}
            textSize={1.6}
            textFontWeight
          />
          <LineBreak space={2} />
          <LineBreak space={2} />

          {loading ? (
            <ActivityIndicator size="small" color={AppColors.BTNCOLOURS} />
          ) : myLikes.length > 0 ? (
            myLikes.map(item => {
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
                      source={{uri: item.photos?.[0]}}
                      style={styles.placeImage}
                    />
                    <View>
                      <AppText
                        title={item.restaurantName}
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
                    onPress={() => addToSpinner(item)}>
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
              title={'No likes yet. Add some places to your likes list first!'}
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
});

export default HelpMeDecide;
