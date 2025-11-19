/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  FlatList,
} from 'react-native';
import AppColors from '../../utils/AppColors';
import LineBreak from '../../components/LineBreak';
import AppImages from '../../assets/images/AppImages';
import AppText from '../../components/AppTextComps/AppText';
import {AppIcons} from '../../assets/icons';
import SVGXml from '../../components/SVGXML';
import {useCustomNavigation} from '../../utils/Hooks';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';
import AppTextInput from '../../components/AppTextInput';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeStarter from '../../components/HomeStarter';
import RecommendedCard from '../../components/RecommendedCard';
import {popularEventData, recommendedData} from '../../utils/LocalData';
import {useSelector} from 'react-redux';
import {baseUrl} from '../../utils/api_content';
import FastImage from 'react-native-fast-image';

const slides = [
  {
    key: 1,
    title: 'Let’s help you set up!',
    text: 'Tell us about your favorite places to visit and eat at — the ones you keep going back to. And don’t hold back on the spots you’d rather avoid! This helps us give you smarter reminders and better suggestions based on what you actually like.',
  },
  {
    key: 2,
    title: 'Let’s help you set up!',
    text: 'Tell us about your favorite places to visit and eat at — the ones you keep going back to. And don’t hold back on the spots you’d rather avoid! This helps us give you smarter reminders and better suggestions based on what you actually like.',
  },
  {
    key: 3,
    title: 'Let’s help you set up!',
    text: 'Tell us about your favorite places to visit and eat at — the ones you keep going back to. And don’t hold back on the spots you’d rather avoid! This helps us give you smarter reminders and better suggestions based on what you actually like.',
  },
  {
    key: 4,
    title: 'Let’s help you set up!',
    text: 'Tell us about your favorite places to visit and eat at — the ones you keep going back to. And don’t hold back on the spots you’d rather avoid! This helps us give you smarter reminders and better suggestions based on what you actually like.',
  },
  {
    key: 5,
    title: 'Let’s help you set up!',
    text: 'Tell us about your favorite places to visit and eat at — the ones you keep going back to. And don’t hold back on the spots you’d rather avoid! This helps us give you smarter reminders and better suggestions based on what you actually like.',
  },
];

const wendysSlides = [
  {
    key: 1,
    title: 'How much would you rate this Brand?',
    data: [
      {id: 1, num: '1'},
      {id: 2, num: '2'},
      {id: 3, num: '3'},
      {id: 4, num: '4'},
      {id: 5, num: '5'},
    ],
  },
  {
    key: 2,
    title: 'How much would you rate this Brand?',
    data: [
      {id: 1, num: '1'},
      {id: 2, num: '2'},
      {id: 3, num: '3'},
      {id: 4, num: '4'},
      {id: 5, num: '5'},
    ],
  },
  {
    key: 3,
    title: 'How much would you rate this Brand?',
    data: [
      {id: 1, num: '1'},
      {id: 2, num: '2'},
      {id: 3, num: '3'},
      {id: 4, num: '4'},
      {id: 5, num: '5'},
    ],
  },
  {
    key: 4,
    title: 'How much would you rate this Brand?',
    data: [
      {id: 1, num: '1'},
      {id: 2, num: '2'},
      {id: 3, num: '3'},
      {id: 4, num: '4'},
      {id: 5, num: '5'},
    ],
  },
  {
    key: 5,
    title: 'How much would you rate this Brand?',
    data: [
      {id: 1, num: '1'},
      {id: 2, num: '2'},
      {id: 3, num: '3'},
      {id: 4, num: '4'},
      {id: 5, num: '5'},
    ],
  },
];

const invcludesSlides = [
  {
    key: 1,
    title: 'Want to include anything else for your future self?',
  },
  {
    key: 2,
    title: 'Want to include anything else for your future self?',
  },
  {
    key: 3,
    title: 'Want to include anything else for your future self?',
  },
  {
    key: 4,
    title: 'Want to include anything else for your future self?',
  },
  {
    key: 5,
    title: 'Want to include anything else for your future self?',
  },
];

const brands = [
  {id: 1, brand: AppImages.brand_one},
  {id: 2, brand: AppImages.brand_two},
  {id: 3, brand: AppImages.brand_three},
  {id: 4, brand: AppImages.brand_four},
  {id: 5, brand: AppImages.brand_five},
  {id: 6, brand: AppImages.brand_six},
];

const Home = () => {
  const sliderRef = useRef(null);
  const {navigateToRoute} = useCustomNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBranding, setShowBranding] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const userData = useSelector((state) => state.user.userData);
const fetchedLocations = useSelector(state => state?.user?.places_nearby);

// console.log("fetchedLocations",fetchedLocations)

// console.log("fetchedLocations",fetchedLocations)
  // slider two states
  const wendysSliderRef = useRef(null);
  const [wendysCurrentIndex, setWendysCurrentIndex] = useState(0);
  const [wendysShowBranding, setWendysShowBranding] = useState(false);
  
  // slider three states
  const includeSliderRef = useRef(null);
  const [includeCurrentIndex, setIncludeCurrentIndex] = useState(0);
  const [includeShowBranding, setIncludeShowBranding] = useState(true);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: AppColors.WHITE}}
      contentContainerStyle={{flexGrow: 1}}>
      <LineBreak space={3} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: responsiveWidth(5),
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 18}}>
          <TouchableOpacity>
            <Image
              source={{uri: `${baseUrl}/${userData?.profileImage}`}}
              style={{width: 50, height: 50, borderRadius: 100}}
            />
          </TouchableOpacity>
          <View style={{gap: 2}}>
            <AppText
              title={'Good Morning 👋'}
              textColor={AppColors.GRAY}
              textSize={1.7}
            />
            <AppText
              title={`${userData?.fullName} ${userData?.nickName}`}
              textColor={AppColors.BLACK}
              textSize={2.2}
              textFontWeight
            />
          </View>
        </View>
        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => navigateToRoute('Notifications')}
            style={{
              borderWidth: 1,
              borderColor: AppColors.WHITE,
              padding: responsiveWidth(2),
              borderRadius: 100,
            }}>
            <SVGXml
              width={'25'}
              height={'25'}
              icon={AppIcons.notification_black}
            />
          </TouchableOpacity>
        </View>
      </View>

      <LineBreak space={3} />


         
      <View
        style={{
          paddingHorizontal: responsiveWidth(5),
        }}>
        <AppTextInput
          inputPlaceHolder={'What event are you looking for...'}
          inputWidth={64}
          logo={
            <Ionicons
              name={'search'}
              size={responsiveFontSize(2.5)}
              color={AppColors.LIGHTGRAY}
            />
          }
          rightIcon={
            <FontAwesome6
              name={'sliders'}
              size={responsiveFontSize(2.5)}
              color={AppColors.BLACK}
            />
          }
        />
      </View>

      <LineBreak space={3} />

      {/* {!showBranding && (
        <HomeStarter
          slides={slides}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          setShowBranding={setShowBranding}
          sliderRef={sliderRef}
          sectionOneBg={AppImages.home_bg}
          sectionTwoBg={'#d9e5ff'}
        />
      )}

      {showBranding && !showRating ? (
        <View>
          <ImageBackground
            source={AppImages.brand_bg}
            imageStyle={{
              borderRadius: 30,
            }}
            style={{
              width: responsiveWidth(88),
              alignSelf: 'center',
              alignItems: 'center',
              height: responsiveHeight(75),
            }}>
            <LineBreak space={3} />
            <AppText
              title={'Select the brands you interact with the most'}
              textColor={AppColors.BLACK}
              textSize={2.8}
              textFontWeight
              textwidth={60}
              lineHeight={3.7}
              textAlignment={'center'}
              textTransform={'uppercase'}
            />
            <LineBreak space={2} />
            <FlatList
              data={brands}
              numColumns={2}
              columnWrapperStyle={{gap: 60}}
              ItemSeparatorComponent={<LineBreak space={2} />}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    style={{
                      borderWidth: 3,
                      borderColor: '#f16b6e',
                      borderRadius: 100,
                      width: 130,
                      height: 130,
                      justifyContent: 'center',
                    }}
                    onPress={() => {
                      setShowRating(true);
                    }}>
                    <Image
                      source={item.brand}
                      style={{width: 120, height: 130}}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </ImageBackground>
        </View>
      ) : null}

      {showRating && !wendysShowBranding ? (
        <HomeStarter
          slides={wendysSlides}
          currentIndex={wendysCurrentIndex}
          setCurrentIndex={setWendysCurrentIndex}
          setShowBranding={setWendysShowBranding}
          sliderRef={wendysSliderRef}
          sectionOneBg={AppImages.wendys}
          sectionTwoBg={AppImages.small_brand_bg}
          rating={'rating'}
        />
      ) : null}

      {wendysShowBranding && !includeShowBranding ? (
        <HomeStarter
          slides={invcludesSlides}
          currentIndex={includeCurrentIndex}
          setCurrentIndex={setIncludeCurrentIndex}
          setShowBranding={setIncludeShowBranding}
          sliderRef={includeSliderRef}
          sectionOneBg={AppImages.wendys}
          sectionTwoBg={AppImages.small_brand_bg}
          rating={'rating'}
          include={'include'}
        />
      ) : null} */}

      {includeShowBranding && (
        <View style={{paddingHorizontal: responsiveWidth(5)}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 2,
            }}>
            <AppText
              title={'Recommended'}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />
            <TouchableOpacity onPress={() => {}}>
              <AppText
                title={'See All'}
                textColor={AppColors.BTNCOLOURS}
                textSize={1.8}
                textFontWeight
              />
            </TouchableOpacity>
          </View>

          <LineBreak space={2} />

            {
              fetchedLocations?.length > 0 ? 
              (

                <FlatList
                  data={fetchedLocations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{gap: 12, marginBottom: responsiveHeight(2)}}
                  renderItem={({item}) => {
                    console.log("item", item.vicinity)
                    return (
                      <>
                      {
                        item?.rating > 4 && (

                          <RecommendedCard
                            item={item}
                            name={item?.name}
                            address={item?.vicinity}
                            CardImg={item?.photos[0]?.photo_reference}
                            cardOnPress={() => navigateToRoute('HomeDetails',{placeDetails: item})}
                            bottomPadding={0.1}
                            cardWidth={35}
                            cardContainerWidth={75}
                            isHeartIconMoveToEnd={true}
                            locationMaxWidth={60}
                          />
                        )
                      }

                      </>
                    );
                  }}
                />
              ):(
                <AppText title={"No Recommendation found"}/>
              )
            }

          <LineBreak space={2} />

          <AppText
            title={'Discover Nearby'}
            textColor={AppColors.BLACK}
            textSize={2}
            textFontWeight
          />

          <LineBreak space={2} />

          <FlatList
            data={fetchedLocations}
            ItemSeparatorComponent={() => <LineBreak space={2} />}
            columnWrapperStyle={{gap: 15, marginBottom: responsiveHeight(2)}}
            numColumns={2}
            renderItem={({item}) => {
              return (
                <RecommendedCard
                  item={item}
                  name={item?.name}
                            address={item?.vicinity}
                            CardImg={item?.photos[0]?.photo_reference}
                  cardOnPress={() => navigateToRoute('HomeDetails')}
                  cardContainerWidth={43}
                  cardWidth={19}
                  titleFontSize={2}
                  dateFontSize={1.5}
                  locationFontSize={1.3}
                  containerPaddingHorizontal={2}
                  textContainerPaddingHorizontal={2}
                  containerPaddingVertical={1}
                  containerborderRadius={25}
                  bottomPadding={1}
                  dateNumOfLines={1}
                  dateMaxWidth={35}
                  locationNumOfLines={1}
                  locationMaxWidth={25}
                  titleMaxWidth={35}
                  titleNumOfLines={1}
                />
              );
            }}
          />
        </View>
      )}

      <LineBreak space={4} />
    </ScrollView>
  );
};

export default Home;
