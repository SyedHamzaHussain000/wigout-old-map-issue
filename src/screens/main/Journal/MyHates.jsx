/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    Image,
    TextInput,
} from 'react-native';
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
import { useCustomNavigation } from '../../../utils/Hooks';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import AppImages from '../../../assets/images/AppImages';
import AppButton from '../../../components/AppButton';

const MyHates = () => {
    const { goBack } = useCustomNavigation();
    const [note, setNote] = useState('');

    const hatedPlaces = [
        {
            id: '1',
            name: "Joe's Diner",
            category: 'Restaurants',
            image: AppImages.resturant,
        },
        {
            id: '2',
            name: "Joe's Diner",
            category: 'Restaurants',
            image: AppImages.resturant,
        },
        {
            id: '3',
            name: "Joe's Diner",
            category: 'Restaurants',
            image: AppImages.resturant,
        },
    ];

    const renderItem = ({ item }) => (
        <View style={styles.placeItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={item.image} style={styles.placeImage} />
                <View>
                    <AppText
                        title={item.name}
                        textColor={AppColors.BLACK}
                        textSize={1.8}
                        textFontWeight
                    />
                    <AppText
                        title={item.category}
                        textColor={AppColors.GRAY}
                        textSize={1.4}
                    />
                </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={20} color="#F44336" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={20} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.WHITE }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
                    <AppText
                        title={'My Hates'}
                        textColor={AppColors.BLACK}
                        textSize={2.5}
                        textFontWeight
                    />
                    <View style={{ width: 40 }} />
                </View>

                <LineBreak space={2} />
                <AppText
                    title={'1 places to avoid'}
                    textColor={AppColors.GRAY}
                    textSize={1.4}
                    style={{ paddingHorizontal: 20 }}
                />

                <LineBreak space={2} />

                <FlatList
                    data={hatedPlaces}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                    ListHeaderComponent={
                        <>
                            {/* Warning Box */}
                            <View style={styles.warningBox}>
                                <Ionicons name="warning-outline" size={24} color="#F44336" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <AppText
                                        title={'Future Feature:'}
                                        textColor="#F44336"
                                        textSize={1.6}
                                        textFontWeight
                                    />
                                    <AppText
                                        title={"We'll warn you with a loud sound and tornado animation when you're about to book one of these places!"}
                                        textColor="#F44336"
                                        textSize={1.4}
                                    />
                                </View>
                            </View>

                            <LineBreak space={3} />

                            {/* Search Bar */}
                            <AppTextInput
                                inputPlaceHolder={'Track your experiences'}
                                inputWidth={80}
                                logo={
                                    <Ionicons
                                        name="search"
                                        size={20}
                                        color={AppColors.GRAY}
                                    />
                                }
                                rightIcon={
                                    <MaterialIcons
                                        name="tune"
                                        size={20}
                                        color={AppColors.BTNCOLOURS}
                                    />
                                }
                            />
                            <LineBreak space={3} />
                        </>
                    }
                    ListFooterComponent={
                        <View style={styles.noteSection}>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Add notes about why you hate this place..."
                                placeholderTextColor={AppColors.GRAY}
                                multiline
                                value={note}
                                onChangeText={setNote}
                            />
                            <View style={styles.noteButtons}>
                                <AppButton
                                    title={'Save'}
                                    btnBackgroundColor={AppColors.BTNCOLOURS}
                                    btnWidth={25}
                                    btnPadding={10}
                                    textSize={1.6}
                                />
                                <AppButton
                                    title={'Cancel'}
                                    btnBackgroundColor={AppColors.WHITE}
                                    textColor={AppColors.BLACK}
                                    borderWidth={1}
                                    borderColor={AppColors.LIGHTGRAY}
                                    btnWidth={25}
                                    btnPadding={10}
                                    textSize={1.6}
                                />
                            </View>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

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
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFEBEE',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    placeImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFEBEE',
    },
    noteSection: {
        backgroundColor: '#FFF9F9',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFEBEE',
        marginTop: 10,
    },
    noteInput: {
        height: 100,
        textAlignVertical: 'top',
        color: AppColors.BLACK,
        fontSize: responsiveFontSize(1.6),
    },
    noteButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
});

export default MyHates;
