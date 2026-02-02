import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import AppTextInput from '../../../components/AppTextInput';
import LineBreak from '../../../components/LineBreak';
import {
  responsiveFontSize,
  responsiveHeight,
} from '../../../utils/Responsive_Dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';

import {useSelector} from 'react-redux';
import {
  addNote,
  GetReviews,
  RemoveReview,
} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';

const MyHates = ({navigation, route}) => {
  const {hatesData} = route.params || {};
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [loader, setLoader] = useState(false);
  const [myHates, setMyHates] = useState(hatesData || []);
  const [filteredHates, setFilteredHates] = useState(hatesData || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    if (hatesData) {
      setMyHates(hatesData);
      setFilteredHates(hatesData);
    }
  }, [hatesData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyHates();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyHates = async () => {
    setLoader(true);
    const response = await GetReviews(token);
    if (response?.reviews) {
      const hatedPlaces = response.reviews.filter(
        res => res.actionType === 'Avoid',
      );
      setMyHates(hatedPlaces);
      setFilteredHates(hatedPlaces);
    }
    setLoader(false);
  };

  const handleSearch = text => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredHates(myHates);
    } else {
      const filtered = myHates.filter(item =>
        item.restaurantName.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredHates(filtered);
    }
  };

  const listHeaderComponent = () => {
    return (
      <>
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={24} color="#F44336" />
          <View style={{flex: 1, marginLeft: 12}}>
            <AppText
              title={'Future Feature:'}
              textColor="#5D1B2D"
              textSize={1.7}
              textFontWeight
            />
            <AppText
              title={
                "We'll warn you with a loud sound and tornado animation when you're about to book one of these places!"
              }
              textColor="#5D1B2D"
              textSize={1.5}
            />
          </View>
        </View>

        <LineBreak space={3} />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
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
        <LineBreak space={3} />
        {loader && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
          </View>
        )}
      </>
    );
  };

  const listEmptyComponent = () => {
    return (
      !loader && (
        <View style={styles.emptyState}>
          <Ionicons name="thumbs-down" size={100} color="#F44336" />
          <LineBreak space={2} />
          <AppText
            title={
              searchQuery
                ? 'No results found'
                : 'No hates yet. Add places you want to avoid!'
            }
            textColor={AppColors.GRAY}
            textSize={1.6}
            textAlignment={'center'}
            textwidth={70}
          />
        </View>
      )
    );
  };

  const renderItem = ({item}) => {
    const isEditing = editingItemId === item._id;
    // console.log('item:-', item?.photos?.[0]);
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
                isEditing && {backgroundColor: '#FFCDD2'},
              ]}
              onPress={() => setEditingItemId(isEditing ? null : item._id)}>
              <MaterialIcons
                name="edit"
                size={20}
                color={isEditing ? '#8B2C39' : AppColors.GRAY}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRemove(item)}
              style={styles.deleteBtn}>
              <MaterialIcons name="delete-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        {item?.notes?.length > 0 && (
          <View style={styles.displayNote}>
            {item.notes.map((note, index) => (
              <AppText
                key={index}
                title={note.noteText}
                textColor={AppColors.BLACK}
                textSize={1.6}
              />
            ))}
          </View>
        )}

        {isEditing && (
          <View style={styles.noteSection}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add notes about why you hate this place..."
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

  const handleRemove = async item => {
    let id = item?._id;
    let data = {
      reviewId: id,
    };

    setLoader(true);
    const res = await RemoveReview(data, token);
    console.log('RES i RemoveReview:-', res);
    if (res?.success) {
      fetchMyHates();
    } else {
      setLoader(false);
    }
  };

  const handleAddNote = async item => {
    let data = {
      reviewId: item?._id,
      noteText: note,
    };
    let res = await addNote(data, token);
    console.log('RES:-', res);
    setNote('');
    fetchMyHates();
    // setEditingItemId(null);
    // navigation.goBack();
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
          <AppText
            title={'My Hates'}
            textColor={AppColors.BLACK}
            textSize={2.8}
            textFontWeight
          />
          <View style={{width: 40}} />
        </View>

        <LineBreak space={2} />
        <AppText
          title={`${filteredHates.length} places to avoid`}
          textColor={AppColors.GRAY}
          textSize={1.6}
          paddingHorizontal={5}
        />

        <LineBreak space={2} />

        <FlatList
          data={loader ? [] : filteredHates}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 20}}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={listEmptyComponent}
        />
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
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: '#FFEBEE',
    borderRadius: 10,
  },
  cardContainer: {
    backgroundColor: AppColors.WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEBEE',
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
    borderColor: '#FFEBEE',
    marginTop: 10,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
    color: AppColors.BLACK,
    fontSize: responsiveFontSize(1.8),
    borderWidth: 1,
    borderColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  noteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: '#8B2C39', // Dark red from mockup
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
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayNote: {
    backgroundColor: '#FFF5F5',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F44336',
    borderRightColor: '#FFEBEE',
    borderTopColor: '#FFEBEE',
    borderBottomColor: '#FFEBEE',
  },
});

export default MyHates;
