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

const HelpMeDecide = () => {
    const { goBack } = useCustomNavigation();
    const [customOption, setCustomOption] = useState('');

    const selectedOptions = [
        {
            id: '1',
            name: 'Ahern Hotel',
            category: 'Restaurants',
            image: AppImages.resturant,
        },
        {
            id: '2',
            name: 'Ahern Comfort Inn Bangor...',
            category: 'Restaurants',
            image: AppImages.resturant,
        },
        {
            id: '3',
            name: 'USA Hotel',
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
                        textSize={1.6}
                        textFontWeight
                    />
                    <AppText
                        title={item.category}
                        textColor={AppColors.GRAY}
                        textSize={1.2}
                    />
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={20} color="#F44336" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.WHITE }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
                    <AppText
                        title={'Help Me Decide'}
                        textColor={AppColors.BLACK}
                        textSize={2.5}
                        textFontWeight
                    />
                    <View style={{ width: 40 }} />
                </View>

                <LineBreak space={2} />
                <AppText
                    title={'Select places from your likes or add custom options'}
                    textColor={AppColors.GRAY}
                    textSize={1.4}
                    style={{ paddingHorizontal: 20 }}
                />

                <LineBreak space={3} />

                <FlatList
                    data={selectedOptions}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    ListHeaderComponent={
                        <>
                            {/* Add Custom Option */}
                            <View style={styles.customOptionSection}>
                                <AppText
                                    title={'Add custom option:'}
                                    textColor={AppColors.BLACK}
                                    textSize={1.6}
                                    textFontWeight
                                />
                                <LineBreak space={1} />
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Enter option name"
                                        placeholderTextColor={AppColors.GRAY}
                                        value={customOption}
                                        onChangeText={setCustomOption}
                                    />
                                    <TouchableOpacity style={styles.addBtn}>
                                        <Ionicons name="add" size={24} color={AppColors.WHITE} />
                                        <AppText title={'Add'} textColor={AppColors.WHITE} textSize={1.6} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <LineBreak space={3} />

                            <AppText
                                title={`Your selected options (${selectedOptions.length}):`}
                                textColor={AppColors.BLACK}
                                textSize={1.6}
                                textFontWeight
                            />
                            <LineBreak space={2} />
                        </>
                    }
                    ListFooterComponent={
                        <>
                            <LineBreak space={3} />
                            <AppText
                                title={'Choose from your likes:'}
                                textColor={AppColors.BLACK}
                                textSize={1.6}
                                textFontWeight
                            />
                            <LineBreak space={2} />
                            <AppText
                                title={'No likes yet. Add some places to your likes list first!'}
                                textColor={AppColors.GRAY}
                                textSize={1.4}
                            />
                        </>
                    }
                />

                {/* Bottom Button */}
                <View style={styles.bottomButtonContainer}>
                    <AppButton
                        title={'Spin the Wheel!'}
                        handlePress={() => { }}
                        btnBackgroundColor={AppColors.BTNCOLOURS}
                        btnWidth={90}
                        leftIcon={
                            <Ionicons name="aperture-outline" size={24} color={AppColors.WHITE} style={{ marginRight: 10 }} />
                        }
                    />
                </View>
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
    customOptionSection: {
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    customInput: {
        flex: 1,
        height: 45,
        backgroundColor: AppColors.WHITE,
        borderRadius: 10,
        paddingHorizontal: 15,
        color: AppColors.BLACK,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.BTNCOLOURS,
        paddingHorizontal: 15,
        height: 45,
        borderRadius: 10,
        gap: 5,
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    placeImage: {
        width: 45,
        height: 45,
        borderRadius: 8,
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
});

export default HelpMeDecide;
