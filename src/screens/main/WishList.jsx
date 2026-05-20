import React, {useEffect, useState} from 'react';
import {View, FlatList, ActivityIndicator, SafeAreaView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import AppHeader from '../../components/AppHeader';
import ScreenWrapper from '../../components/ScreenWrapper';
import AppColors from '../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import AppText from '../../components/AppTextComps/AppText';
import HomeCard from '../../components/HomeCard';
import {GetWishList} from '../../ApiCalls/Main/WishList_API/WishListAPI';
import {Google_Places_Images} from '../../utils/api_content';

const WishList = ({navigation}) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector(state => state.user.current_location);
  const placesNearby = useSelector(state => state.user.places_nearby);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await GetWishList(token);
      if (res?.success) {
        setWishlistItems(res?.wishLists || []);
      }
    } catch (error) {
      console.log('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({item}) => {
    return (
      <View style={{marginBottom: responsiveHeight(2)}}>
        <HomeCard
          name={item?.name}
          address={item?.address}
          CardImg={item?.image}
          cardHeight={30}
          cardWidth={92}
          category={item?.category || 'Restaurant'}
          cardOnPress={() =>
            navigation.navigate('HomeDetails', {placeDetails: item})
          }
        />
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{flex: 1}}>
        <AppHeader heading="Bucket List" onBackPress />
        <AppText
          title={`${wishlistItems.length} places in your Bucket List`}
          textColor={AppColors.GRAY}
          textSize={1.6}
          paddingHorizontal={5}
        />
        <View
          style={{
            flex: 1,
            paddingHorizontal: responsiveWidth(4),
            paddingTop: responsiveHeight(2),
          }}>
          {isLoading ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
            </View>
          ) : wishlistItems.length > 0 ? (
            <FlatList
              data={wishlistItems}
              renderItem={renderItem}
              keyExtractor={item => item._id || item.placeId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: responsiveHeight(5)}}
            />
          ) : (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <AppText
                title="Your Bucket List is empty"
                textColor={AppColors.GRAY}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

export default WishList;
