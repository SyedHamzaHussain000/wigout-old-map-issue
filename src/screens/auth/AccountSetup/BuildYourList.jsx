/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import BackgroundScreen from '../../../components/AppTextComps/BackgroundScreen';
import BackIcon from '../../../components/AppTextComps/BackIcon';
import AppText from '../../../components/AppTextComps/AppText';
import AppButton from '../../../components/AppButton';
import AppColors from '../../../utils/AppColors';
import {
    responsiveHeight,
    responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import { useCustomNavigation } from '../../../utils/Hooks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

const BuildYourList = () => {
    const { navigateToRoute, goBack } = useCustomNavigation();
    const token = useSelector(state => state?.user?.token);

    const handleNext = () => {
        if (token) {
            navigateToRoute('FillYourProfile');
        } else {
            navigateToRoute('Login');
        }
    };

    return (
        <BackgroundScreen>
            <View style={styles.container}>
                <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />

                <View style={styles.content}>
                    <AppText
                        title={"Let's Build Your Lists!"}
                        textSize={3.5}
                        textColor={AppColors.BTNCOLOURS}
                        textFontWeight={true}
                        textAlignment="center"
                    />

                    <View style={{ height: responsiveHeight(15) }} />

                    <AppText
                        title={
                            "Start by adding places you love and places you'd rather avoid. This helps us remind you of your experiences and warn you before making the same mistake twice!"
                        }
                        textSize={1.8}
                        textColor={AppColors.GRAY}
                        textAlignment="center"
                        lineHeight={2.5}
                    />

                    <View style={{ height: responsiveHeight(5) }} />

                    <AppButton
                        title={'Browse Categories'}
                        btnBackgroundColor={"#B04A3D"} // Approximate color from image
                        btnPadding={15}
                        btnWidth={85}
                        handlePress={() => navigateToRoute('BrowseCategories')}
                    />

                    <View style={{ height: responsiveHeight(2) }} />

                    <AppButton
                        title={'Search For Places'}
                        btnBackgroundColor={AppColors.BTNCOLOURS}
                        btnPadding={15}
                        btnWidth={85}
                        leftIcon={
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color={AppColors.WHITE}
                                style={{ marginRight: 10 }}
                            />
                        }
                        handlePress={() => navigateToRoute('SearchForPlaces')}
                    />

                    <View style={{ height: responsiveHeight(3) }} />

                    <TouchableOpacity onPress={handleNext}>
                        <AppText
                            title={'Skip for now'}
                            textSize={1.8}
                            textColor={AppColors.GRAY}
                            textAlignment="center"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </BackgroundScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsiveWidth(5),
    },
});

export default BuildYourList;
