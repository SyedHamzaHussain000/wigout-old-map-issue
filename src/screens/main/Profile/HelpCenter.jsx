import React, {useState, useCallback, Fragment} from 'react';
import {View, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

// Components
import AppHeader from '../../../components/AppHeader';
import LineBreak from '../../../components/LineBreak';
import FAQScreen from '../../../components/FAQScreen';
import ScreenWrapper from '../../../components/ScreenWrapper';
import LineTab from '../../../components/LineTab';
import AppText from '../../../components/AppTextComps/AppText';

// Icons & Style Helpers
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

import AppColors from '../../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';

const HelpCenter = () => {
  const navigation = useNavigation();

  const TABS_DATA = [
    {id: 1, title: 'FAQ'},
    {id: 2, title: 'Contact us'},
  ];

  const [isSelectedTab, setIsSelectedTab] = useState({id: 1});
  const [isSelectedCategorie, SetIsSelectedCategorie] = useState({id: 1});

  const CONTACT_CARDS = [
    {
      id: '1',
      title: 'Customer Service',
      icon: (
        <FontAwesome5
          name="headphones"
          size={responsiveFontSize(2.5)}
          color={AppColors.BTNCOLOURS}
        />
      ),
      onPress: () => {
        navigation.navigate('CustomerService');
      },
    },
    {
      id: '2',
      title: 'Website',
      icon: (
        <MaterialCommunityIcons
          name="web"
          size={responsiveFontSize(2.5)}
          color={AppColors.BTNCOLOURS}
        />
      ),
      onPress: () => {},
    },
    {
      id: '3',
      title: 'Facebook',
      icon: (
        <Ionicons
          name="logo-facebook"
          size={responsiveFontSize(2.5)}
          color={AppColors.BTNCOLOURS}
        />
      ),
      onPress: () => {},
    },
    {
      id: '4',
      title: 'Instagram',
      icon: (
        <Entypo
          name="instagram-with-circle"
          size={responsiveFontSize(2.5)}
          color={AppColors.BTNCOLOURS}
        />
      ),
      onPress: () => {},
    },
  ];
  // Memoized Header Elements to keep things clean
  const renderHeader = useCallback(
    () => (
      <Fragment>
        <AppHeader onBackPress={true} heading="Help Center" />
        <View style={styles.headerLayout}>
          <View style={styles.horizontalPadding}>
            <LineTab
              data={TABS_DATA}
              isSelectedTab={isSelectedTab}
              setIsSelectedTab={setIsSelectedTab}
              textwidth={46}
            />
          </View>
          <LineBreak space={3} />
        </View>
      </Fragment>
    ),
    [navigation, isSelectedTab, isSelectedCategorie],
  );

  const renderItem = () => {
    return (
      <View style={styles.horizontalPadding}>
        <FAQScreen />
      </View>
    );
  };

  const renderContactItem = useCallback(
    ({item}) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={item?.onPress}
        style={styles.cardContainer}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            {item.icon}
            <AppText
              title={item.title}
              textColor={AppColors.BLACK}
              textSize={2}
              textFontWeight
            />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <ScreenWrapper>
      {isSelectedTab.id === 1 ? (
        /* FAQ Screen Tab Configuration */
        <FlatList
          data={[{id: 'faq-content'}]} // Dummy layout driver
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      ) : (
        /* Contact Us Tab Configuration */
        <FlatList
          data={CONTACT_CARDS}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderContactItem}
          ItemSeparatorComponent={() => <LineBreak space={3} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: responsiveHeight(3),
  },
  headerLayout: {
    width: '100%',
    paddingTop: 20,
  },
  horizontalPadding: {
    paddingHorizontal: responsiveWidth(5),
  },
  cardContainer: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: AppColors.appBgColor,
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(3),
    marginHorizontal: responsiveWidth(5),
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
});

export default HelpCenter;
