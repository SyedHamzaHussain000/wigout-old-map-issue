import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import AppText from '../../../components/AppTextComps/AppText';
import AppColors from '../../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {useCustomNavigation} from '../../../utils/Hooks';
import BackgroundScreen from '../../../components/AppTextComps/BackgroundScreen';
import {setIsListBuilt} from '../../../redux/Slices';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../../components/ScreenWrapper';

const {width} = Dimensions.get('window');

const BuildYourList = ({navigation, route}) => {
  const {navigateToRoute, goBack} = useCustomNavigation();
  const dispatch = useDispatch();
  const userSelector = useSelector(state => state.user);
  const {isListBuilt} = userSelector;

  const isFromTab = route.params?.isFromTab;

  const handleSkip = () => {
    if (isListBuilt) {
      if (isFromTab) {
        navigation.goBack();
      } else {
        // Return to main app if already built (e.g. from Profile)
        navigation.navigate('MainTabs');
      }
    } else {
      // Complete onboarding
      dispatch(setIsListBuilt(true));
    }
  };

  const GradientButton = ({title, onPress}) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.gradientBtnContainer}>
      <Svg height="60" width={width * 0.9} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#EB864D" stopOpacity="1" />
            <Stop offset="100%" stopColor="#47082E" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width * 0.9}
          height="60"
          rx="30"
          fill="url(#grad)"
        />
      </Svg>
      <AppText
        title={title}
        textSize={2}
        textColor={AppColors.WHITE}
        textFontWeight={true}
      />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* <TouchableOpacity onPress={() => goBack()}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={AppColors.BTNCOLOURS}
            />
          </TouchableOpacity> */}

          <View style={{flex: 1}}>
            <AppText
              title={"Let's Build Your Lists!"}
              textSize={2.8}
              textColor={AppColors.BTNCOLOURS}
              textFontWeight={true}
              textAlignment="center"
            />
          </View>
        </View>

        <View style={styles.content}>
          <AppText
            title={
              "Start by adding places you love and places you'd rather avoid. This helps us remind you of your experiences and warn you before making the same mistake twice!"
            }
            textSize={1.9}
            textColor="#47082E"
            textAlignment="center"
            lineHeight={2.8}
            style={{marginTop: responsiveHeight(2)}}
          />

          <View style={styles.buttonSection}>
            <GradientButton
              title="Browse Categories"
              onPress={() => navigateToRoute('BrowseCategories')}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateToRoute('SearchForPlaces')}
              style={styles.categoryButton}>
              <AppText
                title="Search for Places"
                textSize={2}
                textColor={AppColors.BTNCOLOURS}
                textFontWeight={true}
              />
            </TouchableOpacity>

            {!isFromTab && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <AppText
                  title="I'll do it later"
                  textSize={1.8}
                  textColor={AppColors.BTNCOLOURS}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSection: {
    width: '100%',
    marginTop: responsiveHeight(4),
    gap: 20,
    alignItems: 'center',
  },
  gradientBtnContainer: {
    width: width * 0.9,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  categoryButton: {
    width: width * 0.9,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Glassmorphic
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skipButton: {
    marginTop: 10,
    padding: 10,
  },
});

export default BuildYourList;
