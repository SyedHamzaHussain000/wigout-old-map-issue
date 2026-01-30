/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
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
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import {useSelector} from 'react-redux';
import {
  addNote,
  GetReviews,
} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import AppButton from '../../../components/AppButton';

const MyLikes = ({navigation, route}) => {
  const {likesData} = route.params || {};
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [loader, setLoader] = useState(false);
  const [myLikes, setMyLikes] = useState(likesData || []);
  const [filteredLikes, setFilteredLikes] = useState(likesData || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    if (likesData) {
      setMyLikes(likesData);
      setFilteredLikes(likesData);
    }
  }, [likesData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyLikes();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyLikes = async () => {
    setLoader(true);
    const response = await GetReviews(token);
    if (response?.reviews) {
      const likedPlaces = response.reviews.filter(
        res => res.actionType === 'Go Again',
      );
      setMyLikes(likedPlaces);
      setFilteredLikes(likedPlaces);
    }
    setLoader(false);
  };

  const handleSearch = text => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredLikes(myLikes);
    } else {
      const filtered = myLikes.filter(item =>
        item.restaurantName.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredLikes(filtered);
    }
  };

  const handleRemove = async item => {
    let id = item?._id;

    setFilteredLikes(prev => prev.filter(item => item?._id !== id));
  };

  const renderItem = ({item}) => {
    const isEditing = editingItemId === item._id;
    // console.log('ITEM:-', item);
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              flex: 1,
            }}
            onPress={() =>
              navigateToRoute('ListViewDetail', {placeDetails: item})
            }>
            <Image
              source={{uri: item?.photos?.[0]}}
              style={styles.placeImage}
            />
            <View style={{flex: 1}}>
              <AppText
                title={item.restaurantName}
                textColor={AppColors.BLACK}
                textSize={1.9}
                textFontWeight
              />
              <AppText
                title={'Restaurants'}
                textColor={AppColors.GRAY}
                textSize={1.5}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.editBtn,
                isEditing && {backgroundColor: '#E8F5E9'},
              ]}
              onPress={() => setEditingItemId(isEditing ? null : item._id)}>
              <MaterialIcons
                name="edit"
                size={20}
                color={isEditing ? AppColors.BTNCOLOURS : AppColors.GRAY}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRemove(item)}
              style={styles.deleteBtn}>
              <MaterialIcons name="delete-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        {isEditing && (
          <View style={styles.noteSection}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add notes about why you love this place..."
              placeholderTextColor={AppColors.GRAY}
              multiline
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.noteButtons}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => handleAddNote(item)}>
                <AppText
                  title="Save"
                  textColor={AppColors.WHITE}
                  textSize={1.8}
                  textAlignment="center"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingItemId(null)}>
                <AppText
                  title="Cancel"
                  textColor={AppColors.BLACK}
                  textSize={1.8}
                  textAlignment="center"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleAddNote = async item => {
    let data = {
      reviewId: item?._id,
      noteText: note,
    };
    let res = await addNote(data, token);
    console.log('RES:-', res);
    // setEditingItemId(null);
    setNote('');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
          <AppText
            title={'My Likes'}
            textColor={AppColors.BLACK}
            textSize={2.8}
            textFontWeight
          />
          <View style={{width: 40}} />
        </View>

        <LineBreak space={2} />
        <AppText
          title={`${filteredLikes.length} places you love`}
          textColor={AppColors.GRAY}
          textSize={1.6}
          paddingHorizontal={5}
        />

        <LineBreak space={2} />

        {/* Search Bar */}
        <View style={{paddingHorizontal: 20}}>
          <AppTextInput
            inputPlaceHolder={'Track your experiences'}
            inputWidth={80}
            value={searchQuery}
            onChangeText={handleSearch}
            logo={<Ionicons name="search" size={20} color={AppColors.GRAY} />}
            rightIcon={
              <MaterialIcons
                name="tune"
                size={20}
                color={AppColors.BTNCOLOURS}
              />
            }
          />
        </View>

        <LineBreak space={2} />

        {/* List Content */}
        <View style={{flex: 1}}>
          {loader ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
            </View>
          ) : filteredLikes.length > 0 ? (
            <FlatList
              data={filteredLikes}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: responsiveHeight(5),
              }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart" size={100} color="#4CAF50" />
              <LineBreak space={2} />
              <AppText
                title={
                  searchQuery
                    ? 'No results found'
                    : 'No likes yet. Start adding places you love!'
                }
                textColor={AppColors.GRAY}
                textSize={1.6}
                textAlignment={'center'}
                textwidth={70}
              />
            </View>
          )}
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
  cardContainer: {
    backgroundColor: AppColors.WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9', // Light green
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeImage: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteSection: {
    backgroundColor: AppColors.WHITE,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    marginTop: 15,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
    color: AppColors.BLACK,
    fontSize: responsiveFontSize(1.8),
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  noteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: AppColors.BTNCOLOURS,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: responsiveHeight(10),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyLikes;
