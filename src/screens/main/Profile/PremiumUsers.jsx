import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import LineBreak from '../../../components/LineBreak';
import AppImages from '../../../assets/images/AppImages';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import AppText from '../../../components/AppTextComps/AppText';
import AppColors from '../../../utils/AppColors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getAllSubscribedUsers,
  shareListing,
} from '../../../GlobalFunctions/main';
import {useSelector} from 'react-redux';
import {baseUrl, ShowToast} from '../../../utils/api_content';

const PremiumUsers = ({navigation}) => {
  const token = useSelector(state => state.user?.token);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [options, setOptions] = useState({
    isAll: true,
    isWishlist: false,
    isAvoid: false,
    isGoAgain: false,
  });

  useEffect(() => {
    _getAllSubscribedUsers(1);
  }, []);

  const _getAllSubscribedUsers = async (pageNumber = 1, isRefresh = false) => {
    if (pageNumber === 1 && !isRefresh) setLoading(true);
    else if (isRefresh) setRefreshing(true);
    else setLoadingMore(true);

    const res = await getAllSubscribedUsers(token, pageNumber, 10);
    console.log('All Subscribed Users API Response:-', res);
    if (res?.success) {
      if (pageNumber === 1) {
        setUsers(res?.data);
      } else {
        setUsers(prev => [...prev, ...res?.data]);
      }
      setPage(res?.pagination?.currentPage || pageNumber);
      setTotalPages(res?.pagination?.totalPages || 1);
    } else {
      ShowToast('error', res?.message || 'Failed to fetch users');
    }
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setPage(1);
    _getAllSubscribedUsers(1, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      _getAllSubscribedUsers(page + 1);
    }
  };

  const _shareListing = async () => {
    if (!selectedUser) return;
    setSharing(true);
    const res = await shareListing(token, selectedUser?._id, options);
    if (res?.success) {
      ShowToast('success', res?.message || 'Listing shared successfully');
      setIsModalVisible(false);
    } else {
      ShowToast('error', res?.message || 'Failed to share listing');
    }
    setSharing(false);
  };

  const toggleOption = key => {
    if (key === 'isAll') {
      setOptions({
        isAll: !options.isAll,
        isWishlist: false,
        isAvoid: false,
        isGoAgain: false,
      });
    } else {
      const newOptions = {
        ...options,
        [key]: !options[key],
      };
      // If any specific option is selected, uncheck "All"
      if (Object.values(newOptions).some(val => val) && key !== 'isAll') {
        newOptions.isAll = false;
      }
      // If no specific options are selected, default back to "All"?
      // Or just let it be empty.
      setOptions(newOptions);
    }
  };

  const openShareModal = user => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const OptionItem = ({label, selected, onPress}) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <AppText title={label} textColor={AppColors.BLACK} textSize={1.8} />
      <Ionicons
        name={selected ? 'checkbox' : 'square-outline'}
        size={24}
        color={selected ? AppColors.BTNCOLOURS : AppColors.GRAY}
      />
    </TouchableOpacity>
  );

  const filteredUsers = useMemo(() => {
    return users?.filter(
      item =>
        item?.fullName?.toLowerCase()?.includes(search?.toLowerCase()) ||
        item?.email?.toLowerCase()?.includes(search?.toLowerCase()),
    );
  }, [users, search]);

  const clearSearch = () => setSearch('');

  const renderHeader = useCallback(
    () => (
      <View>
        <AppHeader
          onBackPress={() => navigation.goBack()}
          heading={'Premium Users'}
        />
        <View style={styles.headingContainer}>
          <AppText
            title={'Premium User Can share their Listings with their friends.'}
            textColor={AppColors.BTNCOLOURS}
            textSize={1.8}
            textAlignment={'center'}
            textFontWeight
          />
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarPill}>
            <Ionicons
              name="search-outline"
              size={20}
              color={AppColors.BTNCOLOURS}
            />
            <TextInput
              placeholder="Search here."
              placeholderTextColor={AppColors.BTNCOLOURS}
              style={styles.searchInput}
              value={search}
              onChangeText={text => setSearch(text)} // Real-time update
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={AppColors.BTNCOLOURS}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    ),
    [navigation, search], // IMPORTANT: search must be a dependency here!
  );

  const renderItem = useCallback(
    ({item}) => (
      <View style={styles.itemContainer}>
        <View style={styles.userInfo}>
          <Image
            source={
              item?.profileImage
                ? {uri: `${baseUrl}/${item.profileImage}`}
                : AppImages.FACE_SCAN
            }
            style={styles.profileImg}
          />
          <View style={styles.textContainer}>
            <AppText
              title={item?.fullName}
              textColor={AppColors.BLACK}
              textSize={1.9}
              textFontWeight
            />
            <AppText
              title={item?.email}
              textColor={AppColors.blackOpacity}
              textSize={1.4}
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.btn}
          onPress={() => openShareModal(item)}>
          <AppText
            title={'Share Listings'}
            textColor={AppColors.WHITE}
            textSize={1.4}
            textFontWeight
          />
        </TouchableOpacity>
      </View>
    ),
    [],
  );

  return (
    <ScreenWrapper>
      {loading && users.length === 0 ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={AppColors.BTNCOLOURS} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers} // Use the filtered memoized list
          keyExtractor={item => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader()}
          ItemSeparatorComponent={() => <LineBreak space={2.5} />}
          ListFooterComponent={() => (
            <View style={{paddingVertical: 20}}>
              {loadingMore && (
                <ActivityIndicator size="small" color={AppColors.BTNCOLOURS} />
              )}
            </View>
          )}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always" // Better UX for searching
        />
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText
                title={'Share Listings'}
                textColor={AppColors.BLACK}
                textSize={2.2}
                textFontWeight
              />
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={AppColors.BLACK} />
              </TouchableOpacity>
            </View>

            <AppText
              title={`Select which listings you want to share with ${selectedUser?.fullName}`}
              textColor={AppColors.GRAY}
              textSize={1.6}
              style={{marginBottom: 20}}
            />

            <OptionItem
              label="All Listings"
              selected={options.isAll}
              onPress={() => toggleOption('isAll')}
            />
            <OptionItem
              label="Wishlist"
              selected={options.isWishlist}
              onPress={() => toggleOption('isWishlist')}
            />
            <OptionItem
              label="Avoid"
              selected={options.isAvoid}
              onPress={() => toggleOption('isAvoid')}
            />
            <OptionItem
              label="Go Again"
              selected={options.isGoAgain}
              onPress={() => toggleOption('isGoAgain')}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.shareBtn, sharing && {opacity: 0.7}]}
              disabled={sharing}
              onPress={_shareListing}>
              {sharing ? (
                <ActivityIndicator color={AppColors.WHITE} />
              ) : (
                <AppText
                  title={'Share Now'}
                  textColor={AppColors.WHITE}
                  textSize={1.8}
                  textFontWeight
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

// ... Styles remain the same as your provided code ...
const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: responsiveHeight(2),
  },
  headingContainer: {
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(2),
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
  },
  profileImg: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: responsiveWidth(7),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btn: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 25,
    backgroundColor: AppColors.BTNCOLOURS,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchBarContainer: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(3),
  },
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 55,
    borderWidth: 1,
    borderColor: AppColors.BTNCOLOURS,
  },
  searchInput: {
    flex: 1,
    height: 45,
    marginLeft: 12,
    fontSize: responsiveFontSize(1.8),
    color: AppColors.BTNCOLOURS,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
  },
  modalContent: {
    backgroundColor: AppColors.WHITE,
    borderRadius: 20,
    width: '100%',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shareBtn: {
    backgroundColor: AppColors.BTNCOLOURS,
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
});

export default PremiumUsers;
