/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    TextInput,
} from 'react-native';
import BackgroundScreen from '../../../components/AppTextComps/BackgroundScreen';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import AppText from '../../../components/AppTextComps/AppText';
import AppButton from '../../../components/AppButton';
import AppColors from '../../../utils/AppColors';
import {
    responsiveHeight,
    responsiveWidth,
    responsiveFontSize,
} from '../../../utils/Responsive_Dimensions';
import { useCustomNavigation } from '../../../utils/Hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppImages from '../../../assets/images/AppImages';
import { useSelector } from 'react-redux';

const BrowseCategories = () => {
    const { navigateToRoute, goBack } = useCustomNavigation();
    const token = useSelector(state => state?.user?.token);
    const [selectedCategory, setSelectedCategory] = useState('Hotel');
    const [customPlace, setCustomPlace] = useState('');

    const handleNext = () => {
        if (token) {
            navigateToRoute('FillYourProfile');
        } else {
            navigateToRoute('Login');
        }
    };

    const categories = [
        { id: '1', name: 'Restaurants', icon: 'restaurant-outline', library: 'Ionicons' },
        { id: '2', name: 'Hotel', icon: 'office-building-outline', library: 'MaterialCommunityIcons' },
        { id: '3', name: 'Cafes', icon: 'coffee-outline', library: 'Ionicons' },
        { id: '4', name: 'Shops', icon: 'bag-handle-outline', library: 'Ionicons' },
        { id: '5', name: 'Travel', icon: 'airplane-outline', library: 'Ionicons' },
        { id: '6', name: 'Other', icon: 'storefront-outline', library: 'Ionicons' },
    ];

    const dummyPlaces = [
        { id: '1', name: "Joe's Diner", category: 'Restaurants', image: AppImages.resturant },
        { id: '2', name: 'Starbucks', category: 'Restaurants', image: AppImages.resturant },
        { id: '3', name: 'Target', category: 'Restaurants', image: AppImages.resturant },
    ];

    const renderCategoryItem = ({ item }) => {
        const isSelected = selectedCategory === item.name;
        return (
            <TouchableOpacity
                style={[
                    styles.categoryItem,
                    isSelected && { backgroundColor: AppColors.BTNCOLOURS },
                ]}
                onPress={() => setSelectedCategory(item.name)}>
                {item.library === 'Ionicons' ? (
                    <Ionicons
                        name={item.icon}
                        size={24}
                        color={isSelected ? AppColors.WHITE : AppColors.BTNCOLOURS}
                    />
                ) : (
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color={isSelected ? AppColors.WHITE : AppColors.BTNCOLOURS}
                    />
                )}
                <AppText
                    title={item.name}
                    textSize={1.2}
                    textColor={isSelected ? AppColors.WHITE : AppColors.BLACK}
                    textAlignment="center"
                />
            </TouchableOpacity>
        );
    };

    const renderPlaceItem = ({ item }) => (
        <View style={styles.placeItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Image source={item.image} style={styles.placeImage} />
                <View style={{ marginLeft: 10 }}>
                    <AppText title={item.name} textSize={1.8} textFontWeight={true} />
                    <AppText title={item.category} textSize={1.4} textColor={AppColors.GRAY} />
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5D6A7' }]}>
                    <Ionicons name="heart-outline" size={18} color={AppColors.WHITE} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF9A9A' }]}>
                    <Ionicons name="thumbs-down-outline" size={18} color={AppColors.WHITE} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <BackgroundScreen>
            <View style={styles.container}>
                <View style={styles.header}>
                    <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
                    <AppText
                        title={'Add Places to your Lists'}
                        textSize={2.5}
                        textColor={AppColors.BTNCOLOURS}
                        textFontWeight={true}
                        textAlignment="center"
                    />
                </View>

                <AppText
                    title={'Select places you love or hate.\nYou can add notes later!'}
                    textSize={1.6}
                    textColor={AppColors.GRAY}
                    textAlignment="center"
                    lineHeight={2}
                />

                <View style={{ height: responsiveHeight(2) }} />

                <FlatList
                    data={categories}
                    renderItem={renderCategoryItem}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
                    scrollEnabled={false}
                />

                <View style={styles.customPlaceSection}>
                    <AppText title={'Add a custom place:'} textSize={1.6} textFontWeight={true} textColor={AppColors.BTNCOLOURS} />
                    <View style={styles.customInputContainer}>
                        <TextInput
                            placeholder="Enter place name"
                            style={styles.customInput}
                            value={customPlace}
                            onChangeText={setCustomPlace}
                        />
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A5D6A7' }]}>
                                <Ionicons name="heart-outline" size={18} color={AppColors.WHITE} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF9A9A' }]}>
                                <Ionicons name="thumbs-down-outline" size={18} color={AppColors.WHITE} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <FlatList
                    data={dummyPlaces}
                    renderItem={renderPlaceItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: responsiveHeight(10) }}
                    showsVerticalScrollIndicator={false}
                />

                <View style={styles.footer}>
                    <AppText title={'0 likes, 0 hates'} textSize={1.6} textColor={AppColors.BTNCOLOURS} textFontWeight={true} />
                    <AppButton
                        title={'Continue'}
                        btnBackgroundColor={"#B04A3D"}
                        btnPadding={12}
                        btnWidth={35}
                        handlePress={handleNext}
                    />
                </View>
            </View>
        </BackgroundScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    categoryItem: {
        width: responsiveWidth(27),
        height: responsiveHeight(12),
        backgroundColor: AppColors.WHITE,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    customPlaceSection: {
        marginBottom: 15,
    },
    customInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F8E9',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    customInput: {
        flex: 1,
        height: 40,
        fontSize: responsiveFontSize(1.6),
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.WHITE,
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    placeImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 35,
        height: 35,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
});

export default BrowseCategories;
