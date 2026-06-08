/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useMemo, memo} from 'react';
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
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

// Components & Utils
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import AppText from '../../../components/AppTextComps/AppText';
import AppTextInput from '../../../components/AppTextInput';
import LineBreak from '../../../components/LineBreak';
import {responsiveWidth} from '../../../utils/Responsive_Dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomNavigation, useDebounce} from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import {useSelector} from 'react-redux';

// API
import {
  addNote,
  GetReviews,
  RemoveReview,
} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {Google_Places_Images} from '../../../utils/api_content';

// ─── Animated Grid Item ───────────────────────────────────────────────────────
const AnimatedGridItem = memo(
  ({item, index, onRemove, onNavigate, onOpenNote}) => {
    const translateY = useSharedValue(60);
    const opacity = useSharedValue(0);

    useEffect(() => {
      const delay = index * 50; // Faster stagger
      translateY.value = withDelay(delay, withTiming(0, {duration: 400}));
      opacity.value = withDelay(delay, withTiming(1, {duration: 400}));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{translateY: translateY.value}],
      opacity: opacity.value,
    }));

    const imageUrl = item?.photos?.[0]
      ? item.photos[0].startsWith('http')
        ? item.photos[0]
        : `${Google_Places_Images}${item.photos[0]}`
      : null;

    return (
      <Animated.View style={[styles.gridCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onNavigate(item)}
          style={styles.imageWrapper}>
          <Image
            source={imageUrl ? {uri: imageUrl} : null}
            style={styles.placeImage}
          />
          <View style={styles.imageOverlay} />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onOpenNote(item)}>
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtnDelete}
              onPress={() => onRemove(item)}>
              <MaterialIcons name="delete-outline" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.cardDetails}>
          <AppText
            title={item.restaurantName}
            textColor={AppColors.BLACK}
            textSize={1.6}
            textFontWeight
            numberOfLines={1}
          />
          <View style={styles.categoryRow}>
            <MaterialIcons name="category" size={12} color="#F44336" />
            <AppText
              title={
                item?.category === 'Rv Park'
                  ? 'Campground'
                  : item?.category || 'Restaurant'
              }
              textColor={AppColors.GRAY}
              textSize={1.2}
            />
          </View>

          {item?.notes?.length > 0 && (
            <View style={styles.noteBadge}>
              <MaterialIcons name="speaker-notes" size={10} color="#F44336" />
              <AppText
                title={item.notes[item.notes.length - 1].noteText}
                textColor={AppColors.GRAY}
                textSize={1}
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
    if (!note.trim()) return onClose();
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
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{width: '100%'}}>
          <Animated.View
            entering={SlideInDown}
            exiting={SlideOutDown}
            style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <AppText
              title={'Add a Note'}
              textColor={AppColors.BLACK}
              textSize={2.2}
              textFontWeight
            />
            <AppText
              title={item?.restaurantName || ''}
              textColor={AppColors.GRAY}
              textSize={1.4}
            />

            <LineBreak space={2} />
            <TextInput
              style={styles.noteInput}
              placeholder="Why avoid this place?"
              placeholderTextColor={AppColors.GRAY}
              multiline
              value={note}
              onChangeText={setNote}
              autoFocus
            />
            <LineBreak space={2} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <AppText
                  title="Cancel"
                  textColor={AppColors.BLACK}
                  textSize={1.6}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <AppText
                  title="Save Note"
                  textColor={AppColors.WHITE}
                  textSize={1.6}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyHates = ({navigation, route}) => {
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);

  const [loader, setLoader] = useState(false);
  const [myHates, setMyHates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchMyHates = async () => {
    setLoader(true);
    try {
      const response = await GetReviews(token);
      if (response?.reviews) {
        const hatedPlaces = response.reviews.filter(
          res =>
            res.actionType === 'Avoid' &&
            !(
              res.exceptions &&
              Array.isArray(res.exceptions) &&
              res.exceptions.includes(res.placeId)
            ),
        );
        setMyHates(hatedPlaces);
      }
    } catch (e) {
      console.log('Error fetching avoid:', e);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchMyHates);
    return unsubscribe;
  }, [navigation]);

  const filteredHates = useMemo(() => {
    if (!debouncedSearch) return myHates;
    return myHates.filter(item =>
      item.restaurantName.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [debouncedSearch, myHates]);

  const handleRemove = useCallback(
    async item => {
      setLoader(true);
      const res = await RemoveReview({reviewId: item?._id}, token);
      if (res?.success) fetchMyHates();
      else setLoader(false);
    },
    [token],
  );

  const handleAddNote = async (item, noteText) => {
    setNoteModalVisible(false);
    const res = await addNote({reviewId: item?._id, noteText}, token);
    if (res) fetchMyHates();
  };

  const handleOpenNote = useCallback(item => {
    setSelectedItem(item);
    setNoteModalVisible(true);
  }, []);

  const renderItem = useCallback(
    ({item, index}) => (
      <AnimatedGridItem
        item={item}
        index={index}
        onRemove={handleRemove}
        onOpenNote={handleOpenNote}
        onNavigate={i => navigateToRoute('HomeDetails', {placeDetails: i})}
      />
    ),
    [handleRemove, handleOpenNote, navigateToRoute],
  );

  const HeaderComponent = useMemo(
    () => (
      <View style={{paddingHorizontal: 20}}>
        {/* <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={24} color="#F44336" />
          <View style={{flex: 1, marginLeft: 12}}>
            <AppText
              title={'Future Feature:'}
              textColor="#5D1B2D"
              textSize={1.6}
              textFontWeight
            />
            <AppText
              title={
                "We'll warn you with a loud sound when you're near these places!"
              }
              textColor="#5D1B2D"
              textSize={1.4}
            />
          </View>
        </View>
        <LineBreak space={2} /> */}
        <AppTextInput
          placeholder={'Search your avoid...'}
          value={searchQuery}
          onChangeText={setSearchQuery}
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
        <LineBreak space={2} />
      </View>
    ),
    [searchQuery],
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <BackIcon onBackPress={goBack} iconColor={AppColors.BLACK} />
          <AppText
            title={'Avoid'}
            textColor={AppColors.BLACK}
            textSize={2.8}
            textFontWeight
          />
          <View style={{width: 30}} />
        </View>

        <AppText
          title={`${filteredHates.length} places to avoid`}
          textColor={AppColors.GRAY}
          textSize={1.4}
          paddingHorizontal={5}
        />
        <LineBreak space={2} />

        <View style={{flex: 1}}>
          {loader && filteredHates.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
            </View>
          ) : (
            <FlatList
              data={filteredHates}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              numColumns={2}
              ListHeaderComponent={HeaderComponent}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="thumbs-down-outline"
                    size={80}
                    color="#F44336"
                  />
                  <AppText
                    title={
                      searchQuery
                        ? 'No results found'
                        : 'Your avoid list is empty'
                    }
                    textColor={AppColors.BLACK}
                    textAlignment="center"
                  />
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>

      <NoteModal
        visible={noteModalVisible}
        item={selectedItem}
        onClose={() => setNoteModalVisible(false)}
        onSave={handleAddNote}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  gridCard: {
    width: responsiveWidth(43),
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrapper: {
    width: '100%',
    height: 110,
  },
  placeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionRow: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    gap: 5,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    padding: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    backgroundColor: '#FFF5F5',
    borderRadius: 5,
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 50,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyHates;
