/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  View,
} from 'react-native';
import AppColors from '../../../utils/AppColors';
import LineBreak from '../../../components/LineBreak';
import AppHeader from '../../../components/AppHeader';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import TopTabs from '../../../components/TopTabs';
import AppImages from '../../../assets/images/AppImages';
import AppText from '../../../components/AppTextComps/AppText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import {useCustomNavigation} from '../../../utils/Hooks';
import {GetReviews} from '../../../ApiCalls/Main/Reviews/ReviewsApiCall';
import {useSelector} from 'react-redux';

const tabsData = [
  {id: 1, title: 'Go Again'},
  {id: 2, title: 'Avoid'},
  {id: 3, title: 'Help Me Decide'},
];

const data = [
  {
    id: 1,
    userImg: AppImages.resturant,
    username: 'Beauty Salon',
    location: 'Grand Park, New York',
  },
  {
    id: 2,
    userImg: AppImages.resturant,
    username: 'Beauty Salon',
    location: 'Grand Park, New York',
  },
  {
    id: 3,
    userImg: AppImages.resturant,
    username: 'Beauty Salon',
    location: 'Grand Park, New York',
  },
  {
    id: 4,
    userImg: AppImages.resturant,
    username: 'Beauty Salon',
    location: 'Grand Park, New York',
  },
];

const Lists = ({navigation}) => {
  const {navigateToRoute} = useCustomNavigation();
  const [isSelectedTab, setIsSelectedTab] = useState({id: 1});

  const [goAgain, setGoAgain] = useState([]);
  const [avoid, setAvoid] = useState([]);
  const [loader, setLoader] = useState(false);
  const token = useSelector(state => state.user.token);

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      getList();
    });

    return nav;
  }, [navigation]);

  const getList = async () => {
    setLoader(true);
    const getReviews = await GetReviews(token);
    console.log('gerreviews', getReviews);

    // console.log("avoid",getReviews)
    const Go_Again = getReviews.reviews.filter(
      res => res.actionType == 'Go Again',
    );
    const Avoid = getReviews.reviews.filter(res => res.actionType == 'Avoid');

    setGoAgain(Go_Again);
    setAvoid(Avoid);
    setLoader(false);
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
      <AppHeader onBackPress heading={'Lists'} />

      <LineBreak space={3} />

      <View style={{paddingHorizontal: responsiveWidth(5)}}>
        <View>
          <TopTabs
            data={tabsData}
            isSelectedTab={isSelectedTab}
            setIsSelectedTab={setIsSelectedTab}
          />
        </View>

        <LineBreak space={3} />

        <View>
          {loader && (
            <ActivityIndicator size={'large'} color={AppColors.BLACK} />
          )}
          <FlatList
            data={isSelectedTab.id == 2 ? avoid : goAgain}
            ItemSeparatorComponent={<LineBreak space={2} />}
            ListFooterComponent={<LineBreak space={2} />}
            renderItem={({item}) => {
              console.log('item===', item);
              return (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: AppColors.DARKGRAY,
                    paddingHorizontal: responsiveWidth(2),
                    paddingVertical: responsiveHeight(1),
                    borderRadius: 7,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 7,
                      alignItems: 'center',
                    }}>
                    <Image
                      source={{uri: item?.photos[0]}}
                      style={{width: 40, height: 40, borderRadius: 100}}
                    />
                    <View>
                      <AppText
                        title={item.restaurantName}
                        textColor={AppColors.BLACK}
                        textSize={1.7}
                        textFontWeight
                      />
                      {/* <LineBreak space={0.2} /> */}
                      <View
                        style={{
                          flexDirection: 'row',
                          width: '93%',
                          justifyContent: 'space-between',
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 3,
                            alignItems: 'center',
                          }}>
                          <Ionicons
                            name={'location'}
                            size={responsiveFontSize(1.3)}
                            color={AppColors.BTNCOLOURS}
                          />
                          <AppText
                            title={item.address}
                            textColor={AppColors.GRAY}
                            textSize={1.3}
                            textwidth={30}
                            numberOfLines={2}
                          />
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                          {isSelectedTab.id !== 3 && (
                            <AppButton
                              title={'Edit'}
                              textSize={1}
                              btnPadding={5}
                              btnBackgroundColor={AppColors.LIGHT_BTNCOLOURS}
                              btnWidth={10}
                              borderRadius={4}
                            />
                          )}
                          {isSelectedTab.id !== 3 && (
                            <AppButton
                              title={'Remove'}
                              textSize={1}
                              btnPadding={5}
                              btnBackgroundColor={'red'}
                              btnWidth={12}
                              borderRadius={4}
                            />
                          )}
                          <AppButton
                            title={'View Details'}
                            textSize={isSelectedTab.id == 3 ? 1.2 : 1}
                            btnPadding={isSelectedTab.id == 3 ? 8 : 5}
                            btnBackgroundColor={AppColors.BTNCOLOURS}
                            btnWidth={isSelectedTab.id == 3 ? 20 : 16}
                            borderRadius={4}
                            handlePress={() =>
                              navigateToRoute('ListViewDetail', {
                                placeDetails: item,
                              })
                            }
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default Lists;
