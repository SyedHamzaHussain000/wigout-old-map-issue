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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
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
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {Google_Places_Images} from '../../../utils/api_content';
import moment from 'moment';
import {useIsFocused} from '@react-navigation/native';

// ─── Animated Grid Item ───────────────────────────────────────────────────────
const AnimatedGridItem = memo(({item, index, onNavigate}) => {
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
        {/* <View style={styles.categoryRow}>
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
        </View> */}

        <View style={styles.categoryRow}>
          <MaterialIcons
            name="date-range"
            size={responsiveFontSize(1.3)}
            color={AppColors.BTNCOLOURS}
          />
          <AppText
            title={moment(item.createdAt).format('YYYY/MM/DD - HH:mm')}
            textColor={AppColors.GRAY}
            textSize={1.3}
          />
        </View>
        <View style={styles.categoryRow}>
          <MaterialIcons
            name="location-pin"
            size={responsiveFontSize(1.3)}
            color={AppColors.BTNCOLOURS}
          />
          <AppText
            title={item.address}
            textColor={AppColors.GRAY}
            textSize={1.3}
          />
        </View>
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const Visited = ({navigation, route}) => {
  const {likesData, hatesData} = route.params || {};
  const {goBack, navigateToRoute} = useCustomNavigation();
  const token = useSelector(state => state.user.token);
  const [loader, setLoader] = useState(false);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocussed = useIsFocused();

  const debouncedSearch = useDebounce(searchQuery, 500);

  const filteredVisited = useMemo(() => {
    if (!debouncedSearch) return visitedPlaces;
    return visitedPlaces.filter(item =>
      item.restaurantName.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [debouncedSearch, visitedPlaces]);

  useEffect(() => {
    const combined = [];
    if (likesData) combined.push(...likesData);
    if (hatesData) combined.push(...hatesData);

    // Sort by date newest first before deduplication
    const sorted = combined.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    const visitedMap = new Map();
    sorted.forEach(item => {
      const id = item.placeId || item.restaurantId || item._id;
      if (!visitedMap.has(id)) {
        visitedMap.set(id, item);
      }
    });
    setVisitedPlaces(Array.from(visitedMap.values()));
  }, [likesData, hatesData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVisitedPlaces();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchVisitedPlaces = async () => {
    setLoader(true);
    const response = await GetReviews(token);
    if (response?.reviews) {
      const places = response.reviews.filter(
        res => res.actionType === 'Go Again' || res.actionType === 'Avoid',
      );

      // Sort by date newest first before deduplication
      const sorted = places.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const visitedMap = new Map();
      sorted.forEach(item => {
        const id = item.placeId || item.restaurantId || item._id;
        if (!visitedMap.has(id)) {
          visitedMap.set(id, item);
        }
      });
      setVisitedPlaces(Array.from(visitedMap.values()));
    }
    setLoader(false);
  };

  const handleSearch = text => setSearchQuery(text);

  const renderItem = useCallback(
    ({item, index}) => (
      <AnimatedGridItem
        item={item}
        index={index}
        onNavigate={i => navigateToRoute('HomeDetails', {placeDetails: i})}
      />
    ),
    [navigateToRoute],
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
              title={'Visited'}
              textColor={AppColors.BLACK}
              textSize={2.8}
              textFontWeight
            />
            <View style={{width: 40}} />
          </View>

          <LineBreak space={1.5} />
          <AppText
            title={`${filteredVisited.length} places visited`}
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
            ) : filteredVisited.length > 0 ? (
              <FlatList
                data={filteredVisited}
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
                    name="location"
                    size={80}
                    color={AppColors.BTNCOLOURS}
                  />
                </Animated.View>
                <LineBreak space={2} />
                <AppText
                  title={
                    searchQuery
                      ? 'No results found'
                      : 'No visited places yet.\nStart adding reviews!'
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
  statusInImage: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardDetails: {
    padding: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
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

export default Visited;
