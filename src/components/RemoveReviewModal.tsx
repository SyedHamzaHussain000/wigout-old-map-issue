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

interface RemoveReviewModalProps {
  isVisible: boolean;
  onRemoveSpecific: () => void;
  onRemoveAllBranches: () => void;
  onCancel: () => void;
  loadingSpecific?: boolean;
  loadingAll?: boolean;
}

const RemoveReviewModal = ({
  isVisible,
  onRemoveSpecific,
  onRemoveAllBranches,
  onCancel,
  loadingSpecific = false,
  loadingAll = false,
}: RemoveReviewModalProps) => {
  const isAnyLoading = loadingSpecific || loadingAll;

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
          title="Are you sure you want to unblock?"
          textColor={AppColors.BLACK}
          textSize={2.2}
          textAlignment="center"
          textFontWeight
        />
        <LineBreak space={2} />
        <AppText
          title="Choose whether to unblock only this location or all branches of this brand."
          textColor={AppColors.GRAY}
          textSize={1.6}
          textAlignment="center"
        />
        <LineBreak space={3} />
        <View style={styles.buttonContainer}>
          <AppButton
            title="Remove This Place From Avoid"
            handlePress={onRemoveSpecific}
            btnWidth={80}
            btnBackgroundColor={AppColors.avoid}
            loading={loadingSpecific}
            disabled={loadingAll}
          />
          <LineBreak space={1.5} />
          <AppButton
            title="Remove All Branches From Avoid"
            handlePress={onRemoveAllBranches}
            btnWidth={80}
            btnBackgroundColor={AppColors.BTNCOLOURS}
            loading={loadingAll}
            disabled={loadingSpecific}
          />
          <LineBreak space={1.5} />
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelBtn}
            disabled={isAnyLoading}>
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

export default RemoveReviewModal;
