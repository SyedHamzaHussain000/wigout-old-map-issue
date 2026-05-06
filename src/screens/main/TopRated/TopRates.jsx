import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppColors from '../../../utils/AppColors';
import FetchNearbyPlaces from '../../../ApiCalls/Main/FetchNearbyPlaces';
import {GetWishList} from '../../../ApiCalls/Main/WishList_API/WishListAPI';
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {useCustomNavigation, useDebounce} from '../../../utils/Hooks';
import AppText from '../../../components/AppTextComps/AppText';
import HomeCard from '../../../components/HomeCard';
import Animated, {FadeIn, FadeInDown, Layout} from 'react-native-reanimated';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CATEGORIES = [
  {
    id: '1',
    name: 'Restaurants',
    icon: 'restaurant-outline',
    type: 'restaurant',
    keyword: 'restaurant eat food dining eat-out takeaway delivery',
    library: 'Ionicons',
  },
  {
    id: '2',
    name: 'Hotel',
    icon: 'office-building',
    type: 'lodging',
    keyword: 'hotel inn motel accommodation stay overnight lodging',
    library: 'MaterialCommunityIcons',
  },
  {
    id: '3',
    name: 'Cafes',
    icon: 'cafe-outline',
    type: 'cafe',
    keyword: 'cafe coffee shop tea lounge',
    library: 'Ionicons',
  },
  {
    id: '4',
    name: 'RV Parks & Recreation',
    icon: 'rv-truck',
    type: 'rv_park',
    keyword: 'rv park recreation rv-park camping campground campsite',
    library: 'MaterialCommunityIcons',
  },
  {
    id: '5',
    name: 'To do Near Me',
    icon: 'map-outline',
    type: '',
    keyword: 'zoo museum science center art show',
    library: 'Ionicons',
  },
  {
    id: '6',
    name: 'Shopping',
    icon: 'cart-outline',
    type: '',
    keyword: 'shopping mall store clothing_store',
    library: 'Ionicons',
  },
  {
    id: '7',
    name: 'Bar',
    icon: 'beer-outline',
    type: 'bar',
    keyword:
      'bar pub nightclub lounge alcoholic drinks cocktails beer wine spirits',
    library: 'Ionicons',
  },
  {
    id: '8',
    name: 'Gym',
    icon: 'fitness-outline',
    type: 'gym',
    keyword: 'gym fitness workout health exercise sports equipment training',
    library: 'Ionicons',
  },
  {
    id: '9',
    name: 'Other',
    icon: 'storefront-outline',
    type: 'establishment',
    library: 'Ionicons',
  },
];

const AnimatedCard = ({item, index, navigation, selectedCategory}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120)
        .duration(600)
        .springify()
        .damping(12)}>
      <View style={{marginBottom: responsiveHeight(2)}}>
        <HomeCard
          name={item?.name}
          address={item?.vicinity}
          CardImg={item?.photos?.[0]?.photo_reference}
          cardHeight={30}
          cardWidth={92}
          category={selectedCategory?.name}
          cardOnPress={() =>
            navigation.navigate('HomeDetails', {placeDetails: item})
          }
        />
      </View>
    </Animated.View>
  );
};

const TopRated = ({navigation}) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector(state => state.user.current_location);
  const placesNearby = useSelector(state => state.user.places_nearby);
  const token = useSelector(state => state.user.token);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState('');
  const [excludedPlaceIds, setExcludedPlaceIds] = useState(new Set());
  const [likedItems, setLikedItems] = useState([]);
  const [avoidItems, setAvoidItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const {navigateToRoute} = useCustomNavigation();
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const fetchUserLists = async () => {
      if (!token) return;
      try {
        const [revRes, wishRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);

        const ids = new Set();
        if (revRes?.reviews) {
          const liked = revRes.reviews.filter(r => r.actionType === 'Go Again');
          const avoided = revRes.reviews.filter(r => r.actionType === 'Avoid');
          setLikedItems(liked);
          setAvoidItems(avoided);
          revRes.reviews.forEach(r => ids.add(r.placeId));
        }

        const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
        if (wishlistData && Array.isArray(wishlistData)) {
          setWishlistItems(wishlistData);
          wishlistData.forEach(w => ids.add(w.placeId));
        }

        setExcludedPlaceIds(ids);
      } catch (error) {
        console.log('Error fetching user filters:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchUserLists);
    fetchUserLists(); // Initial fetch
    return unsubscribe;
  }, [navigation, token]);

  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      fetchData(debouncedSearch);
    }
  }, [currentLocation, selectedCategory, debouncedSearch]);

  const fetchData = async (query = '', showLoader = true) => {
    if (showLoader) setIsLoading(true);
    await FetchNearbyPlaces(
      currentLocation,
      dispatch,
      selectedCategory.type,
      query || selectedCategory.keyword || '',
    );
    if (showLoader) setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (token) {
      try {
        const [revRes, wishRes] = await Promise.all([
          GetReviews(token),
          GetWishList(token),
        ]);

        const ids = new Set();
        if (revRes?.reviews) {
          const liked = revRes.reviews.filter(r => r.actionType === 'Go Again');
          const avoided = revRes.reviews.filter(r => r.actionType === 'Avoid');
          setLikedItems(liked);
          setAvoidItems(avoided);
          revRes.reviews.forEach(r => ids.add(r.placeId));
        }

        const wishlistData = wishRes?.wishLists || wishRes?.data || wishRes;
        if (wishlistData && Array.isArray(wishlistData)) {
          setWishlistItems(wishlistData);
          wishlistData.forEach(w => ids.add(w.placeId));
        }

        setExcludedPlaceIds(ids);
      } catch (error) {
        console.log('Error refreshing filters:', error);
      }
    }
    await fetchData(debouncedSearch, false);
    setRefreshing(false);
  };

  // Sort places by rating in descending order and filter out excluded items
  const topRatedPlaces = [...placesNearby]
    .filter(place => place.rating && !excludedPlaceIds.has(place.place_id))
    .sort((a, b) => b.rating - a.rating);

  const renderItem = ({item, index}) => {
    return (
      <AnimatedCard
        item={item}
        index={index}
        navigation={navigation}
        selectedCategory={selectedCategory}
      />
    );
  };

  // console.log('selectedCategory:-', selectedCategory);
  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <AppHeader heading={`Top Rated ${selectedCategory.name}`} />

        <View style={styles.statsRow}>
          <TouchableOpacity
            onPress={() => navigateToRoute('MyLikes')}
            style={styles.statChip}>
            <Ionicons name="heart" size={16} color="#4CAF50" />
            <AppText
              title={`${likedItems.length} Go Again`}
              textSize={1.3}
              textColor="#4CAF50"
              textFontWeight
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateToRoute('MyHates')}
            style={styles.statChip}>
            <Ionicons name="thumbs-down" size={16} color="#D32F2F" />
            <AppText
              title={`${avoidItems.length} Avoid`}
              textSize={1.3}
              textColor="#D32F2F"
              textFontWeight
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateToRoute('WishList')}
            style={styles.statChip}>
            <FontAwesome name="bookmark" size={16} color="#FF9800" />
            <AppText
              title={`${wishlistItems.length} Wish List`}
              textSize={1.3}
              textColor="#FF9800"
              textFontWeight
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarPill}>
            <Ionicons name="search-outline" size={20} color="#47082E" />
            <TextInput
              placeholder="Search top rated places..."
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={search}
              onChangeText={text => setSearch(text)}
              onSubmitEditing={() => fetchData(search)}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  fetchData('');
                  setSearch('');
                }}>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#47082E"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}>
            {CATEGORIES.map(category => {
              const isActive = selectedCategory.id === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.tabItem, isActive && styles.activeTabItem]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}>
                  <View style={styles.tabContent}>
                    {category.library === 'Ionicons' ? (
                      <Ionicons
                        name={category.icon}
                        size={15}
                        color={isActive ? '#FFF' : '#47082E'}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={category.icon}
                        size={15}
                        color={isActive ? '#FFF' : '#47082E'}
                      />
                    )}
                    <AppText
                      title={category.name}
                      textColor={isActive ? '#FFF' : '#47082E'}
                      textSize={1.5}
                      textFontWeight={isActive}
                      paddingLeft={1}
                    />
                  </View>
                  {isActive && (
                    <Animated.View
                      layout={Layout.springify()}
                      style={styles.activeIndicator}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: responsiveWidth(4),
          }}>
          {isLoading ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
            </View>
          ) : topRatedPlaces.length > 0 ? (
            <Animated.FlatList
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[AppColors.BTNCOLOURS]}
                  tintColor={AppColors.BTNCOLOURS}
                />
              }
              entering={FadeIn.duration(400)}
              data={topRatedPlaces}
              renderItem={renderItem}
              keyExtractor={item => item.place_id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: responsiveHeight(2),
                paddingBottom: responsiveHeight(5),
              }}
            />
          ) : (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <AppText
                title={`No ${selectedCategory.name.toLowerCase()} found nearby`}
                textColor={AppColors.GRAY}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    paddingVertical: responsiveHeight(2),
    backgroundColor: 'transparent',
    marginTop: responsiveHeight(0.5),
  },
  tabScrollContent: {
    paddingHorizontal: responsiveWidth(4),
    gap: responsiveWidth(3),
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: responsiveWidth(25),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeTabItem: {
    backgroundColor: AppColors.BTNCOLOURS,
    borderColor: AppColors.BTNCOLOURS,
    elevation: 6,
    shadowColor: AppColors.BTNCOLOURS,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 6,
    height: 6,
    backgroundColor: AppColors.BTNCOLOURS,
    borderRadius: 3,
  },
  searchBarContainer: {
    paddingHorizontal: responsiveWidth(4),
    marginTop: responsiveHeight(1),
  },
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    height: 45,
    marginLeft: 12,
    fontSize: responsiveFontSize(1.8),
    color: '#47082E',
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 15,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
  },
});

export default TopRated;
