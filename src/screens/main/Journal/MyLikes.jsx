/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useCallback, useMemo, memo} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import ScreenWrapper from '../../../components/ScreenWrapper';
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
import {useCustomNavigation, useDebounce} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import {useSelector} from 'react-redux';
import {
  addNote,
  GetReviews,
  RemoveReview,
} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {Google_Places_Images} from '../../../utils/api_content';

// ─── Animated Grid Item ───────────────────────────────────────────────────────
const AnimatedGridItem = memo(
  ({
    item,
    index,
    editingItemId,
    setEditingItemId,
    onRemove,
    onNavigate,
    onOpenNote,
  }) => {
    const translateY = useSharedValue(60);
    const opacity = useSharedValue(0);

    useEffect(() => {
      const delay = index * 80;
      translateY.value = withDelay(
        delay,
        withTiming(0, {duration: 450, easing: Easing.out(Easing.cubic)}),
      );
      opacity.value = withDelay(
        delay,
        withTiming(1, {duration: 450, easing: Easing.out(Easing.cubic)}),
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{translateY: translateY.value}],
      opacity: opacity.value,
    }));

    const isEditing = editingItemId === item._id;

    // console.log('item.category:-', item?.category);

    return (
      <Animated.View style={[styles.gridCard, animatedStyle]}>
        {/* Image */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onNavigate(item)}
          style={styles.imageWrapper}>
          <Image
            source={{
              uri: item?.photos?.[0]
                ? item.photos[0].startsWith('http')
                  ? item.photos[0]
                  : `${Google_Places_Images}${item.photos[0]}`
                : undefined,
            }}
            style={styles.placeImage}
          />
          {/* Gradient Overlay */}
          <View style={styles.imageOverlay} />

          {/* Action Buttons on Image */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.iconBtn, isEditing && styles.iconBtnActive]}
              onPress={() => onOpenNote(item)}>
              <MaterialIcons
                name="edit"
                size={responsiveFontSize(1.8)}
                color={isEditing ? AppColors.BTNCOLOURS : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnDelete}
              onPress={() => onRemove(item)}>
              <MaterialIcons
                name="delete-outline"
                size={responsiveFontSize(1.8)}
                color="#F44336"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.cardDetails}>
          <AppText
            title={item.restaurantName}
            textColor={AppColors.BLACK}
            textSize={1.7}
            textFontWeight
            numberOfLines={1}
          />
          <View style={styles.categoryRow}>
            <MaterialIcons
              name="category"
              size={responsiveFontSize(1.3)}
              color={AppColors.BTNCOLOURS}
            />
            <AppText
              title={
                item.category === 'Rv Park'
                  ? 'Campground'
                  : item.category || 'Restaurant'
              }
              textColor={AppColors.GRAY}
              textSize={1.3}
            />
          </View>

          {/* Notes preview */}
          {item?.notes?.length > 0 && (
            <View style={styles.noteBadge}>
              <MaterialIcons
                name="speaker-notes"
                size={responsiveFontSize(1.2)}
                color={AppColors.BTNCOLOURS}
              />
              <AppText
                title={item.notes[item.notes.length - 1].noteText}
                textColor={AppColors.GRAY}
                textSize={1.1}
                numberOfLines={1}
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  },
);

// ─── Note Modal ───────────────────────────────────────────────────────────────
const NoteModal = ({visible, item, onClose, onSave}) => {
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(item, note);
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{width: '100%', alignItems: 'center'}}>
          <Animated.View
            entering={SlideInDown.duration(350).easing(
              Easing.out(Easing.cubic),
            )}
            exiting={SlideOutDown.duration(300)}
            style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <AppText
              title={'Add a Note'}
              textColor={AppColors.BLACK}
              textSize={2.2}
              textFontWeight
            />
            <LineBreak space={1} />
            {item?.restaurantName ? (
              <AppText
                title={item.restaurantName}
                textColor={AppColors.GRAY}
                textSize={1.5}
              />
            ) : null}
            <LineBreak space={2} />
            <TextInput
              style={styles.noteInput}
              placeholder="Why do you love this place?"
              placeholderTextColor={AppColors.GRAY}
              multiline
              value={note}
              onChangeText={setNote}
            />
            <LineBreak space={1.5} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <AppText
                  title="Cancel"
                  textColor={AppColors.BLACK}
                  textSize={1.8}
                  textAlignment="center"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <AppText
                  title="Save Note"
                  textColor={AppColors.WHITE}
                  textSize={1.8}
                  textAlignment="center"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const MyLikes = ({navigation, route}) => {
  const {likesData} = route.params || {};
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [loader, setLoader] = useState(false);
  const [myLikes, setMyLikes] = useState(likesData || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const filteredLikes = useMemo(() => {
    if (!debouncedSearch) return myLikes;
    return myLikes.filter(item =>
      item.restaurantName.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [debouncedSearch, myLikes]);

  useEffect(() => {
    if (likesData) setMyLikes(likesData);
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
    }
    setLoader(false);
  };

  const handleSearch = text => setSearchQuery(text);

  const handleRemove = useCallback(
    async item => {
      let data = {reviewId: item?._id};
      setLoader(true);
      const res = await RemoveReview(data, token);
      if (res?.success) {
        fetchMyLikes();
      } else {
        setLoader(false);
      }
    },
    [token],
  );

  const handleOpenNote = useCallback(item => {
    setSelectedItem(item);
    setNoteModalVisible(true);
  }, []);

  const handleAddNote = async (item, noteText) => {
    if (!noteText.trim()) {
      setNoteModalVisible(false);
      return;
    }
    let data = {reviewId: item?._id, noteText};
    await addNote(data, token);
    setNoteModalVisible(false);
    fetchMyLikes();
  };

  const renderItem = useCallback(
    ({item, index}) => (
      <AnimatedGridItem
        item={item}
        index={index}
        editingItemId={editingItemId}
        setEditingItemId={setEditingItemId}
        onRemove={handleRemove}
        onOpenNote={handleOpenNote}
        onNavigate={i => navigateToRoute('HomeDetails', {placeDetails: i})}
      />
    ),
    [editingItemId, handleRemove, navigateToRoute, handleOpenNote],
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
              title={'Go Again'}
              textColor={AppColors.BLACK}
              textSize={2.8}
              textFontWeight
            />
            <View style={{width: 40}} />
          </View>

          <LineBreak space={1.5} />
          <AppText
            title={`${filteredLikes.length} places you love`}
            textColor={AppColors.GRAY}
            textSize={1.6}
            paddingHorizontal={5}
          />

          <LineBreak space={1.5} />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <AppTextInput
              placeholder={'Search'}
              inputWidth={80}
              value={searchQuery}
              onChangeText={handleSearch}
              logo={<Ionicons name="search" size={20} color={AppColors.GRAY} />}
              rightIcon={
                searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={AppColors.GRAY}
                    />
                  </TouchableOpacity>
                ) : null
              }
            />
          </View>

          <LineBreak space={2} />

          {/* Grid List */}
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
                numColumns={2}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Animated.View entering={FadeIn.delay(200).duration(500)}>
                  <Ionicons
                    name="heart"
                    size={80}
                    color={AppColors.BTNCOLOURS}
                  />
                </Animated.View>
                <LineBreak space={2} />
                <AppText
                  title={
                    searchQuery
                      ? 'No results found'
                      : 'No likes yet.\nStart adding places you love!'
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

      {/* Note Modal */}
      <NoteModal
        visible={noteModalVisible}
        item={selectedItem}
        onClose={() => setNoteModalVisible(false)}
        onSave={handleAddNote}
      />
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  searchContainer: {
    marginHorizontal: 20,
    // borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: responsiveWidth(3),
    paddingBottom: responsiveHeight(5),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: responsiveHeight(1.5),
  },
  // ── Grid Card ──
  gridCard: {
    width: responsiveWidth(44),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  imageWrapper: {
    width: '100%',
    height: responsiveHeight(14),
  },
  placeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  actionRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    padding: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#F0FAF2',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    elevation: 0.5,
  },
  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  noteInput: {
    height: 120,
    textAlignVertical: 'top',
    color: AppColors.BLACK,
    fontSize: responsiveFontSize(1.8),
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: AppColors.BTNCOLOURS,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  // ── Empty / Loader ──
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
