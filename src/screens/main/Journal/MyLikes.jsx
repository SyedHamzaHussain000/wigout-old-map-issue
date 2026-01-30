/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
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

const MyLikes = () => {
    const { goBack } = useCustomNavigation();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.WHITE }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackIcon onBackPress={() => goBack()} iconColor={AppColors.BLACK} />
                    <AppText
                        title={'My Likes'}
                        textColor={AppColors.BLACK}
                        textSize={2.5}
                        textFontWeight
                    />
                    <View style={{ width: 40 }} /> {/* Spacer for centering */}
                </View>

                <LineBreak space={2} />
                <AppText
                    title={'0 places you love'}
                    textColor={AppColors.GRAY}
                    textSize={1.4}
                    style={{ paddingHorizontal: 20 }}
                />

                <LineBreak space={2} />

                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20 }}>
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
                </View>

                {/* Empty State */}
                <View style={styles.emptyState}>
                    <Ionicons name="heart" size={100} color="#4CAF50" />
                    <LineBreak space={2} />
                    <AppText
                        title={'No likes yet. Start adding places you love!'}
                        textColor={AppColors.GRAY}
                        textSize={1.6}
                        textAlignment={'center'}
                        textwidth={70}
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: responsiveHeight(10),
    },
});

export default MyLikes;
