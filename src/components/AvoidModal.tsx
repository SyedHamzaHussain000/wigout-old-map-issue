import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modal';
import AppColors from '../utils/AppColors';
import AppText from './AppTextComps/AppText';
import AppButton from './AppButton';
import {
  responsiveHeight,
  responsiveWidth,
} from '../utils/Responsive_Dimensions';
import LineBreak from './LineBreak';

interface AvoidModalProps {
  isVisible: boolean;
  onAvoidPlace: () => void;
  onAvoidAllBranches: () => void;
  onCancel: () => void;
  avoidPlaceLoading?: boolean;
  avoidAllBranchesLoading?: boolean;
}

const AvoidModal = ({
  isVisible,
  onAvoidPlace,
  onAvoidAllBranches,
  onCancel,
  avoidPlaceLoading = false,
  avoidAllBranchesLoading = false,
}: AvoidModalProps) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      style={styles.modal}>
      <View style={styles.container}>
        <AppText
          title="Avoid Recommendation"
          textColor={AppColors.BLACK}
          textSize={2.2}
          textAlignment="center"
          textFontWeight
        />
        <LineBreak space={2} />
        <AppText
          title="Do you want to avoid only this specific location or all branches of this place?"
          textColor={AppColors.GRAY}
          textSize={1.6}
          textAlignment="center"
        />
        <LineBreak space={3} />
        <View style={styles.buttonContainer}>
          <AppButton
            title="Avoid This Place"
            handlePress={onAvoidPlace}
            btnWidth={80}
            btnBackgroundColor={AppColors.avoid}
            loading={avoidPlaceLoading}
            disabled={avoidAllBranchesLoading}
          />
          <LineBreak space={1.5} />
          <AppButton
            title="Avoid All Nearby Branches"
            handlePress={onAvoidAllBranches}
            btnWidth={80}
            btnBackgroundColor={AppColors.BTNCOLOURS}
            loading={avoidAllBranchesLoading}
            disabled={avoidPlaceLoading}
          />
          <LineBreak space={1.5} />
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelBtn}
            disabled={avoidPlaceLoading || avoidAllBranchesLoading}>
            <AppText
              title="Cancel"
              textColor={AppColors.GRAY}
              textSize={1.6}
              textFontWeight
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: responsiveWidth(90),
    backgroundColor: AppColors.WHITE,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cancelBtn: {
    padding: 10,
    marginTop: 5,
  },
});

export default AvoidModal;
