import React from 'react';
import {View, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import AppColors from '../utils/AppColors';
import AppText from './AppTextComps/AppText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {responsiveWidth} from '../utils/Responsive_Dimensions';
import LineBreak from './LineBreak';

interface SuspensionModalProps {
  isVisible: boolean;
  message: string;
  reason?: string;
  suspendedUntil?: string;
  onClose: () => void;
}

const SuspensionModal = ({
  isVisible,
  message,
  reason,
  suspendedUntil,
  onClose,
}: SuspensionModalProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={60} color={AppColors.RED_COLOR} />
          </View>

          <AppText
            title="Account Suspended"
            textColor={AppColors.BLACK}
            textSize={2.4}
            textFontWeight
            textAlignment="center"
          />

          <LineBreak space={2} />

          <AppText
            title={message}
            textColor={AppColors.GRAY}
            textSize={1.6}
            textAlignment="center"
          />

          <LineBreak space={3} />

          {reason && suspendedUntil && (
            <View style={styles.infoBox}>
              {reason && (
                <View style={styles.infoRow}>
                  <AppText
                    title="Reason: "
                    textColor={AppColors.BLACK}
                    textSize={1.4}
                    textFontWeight
                  />
                  <AppText
                    title={reason || 'N/A'}
                    textColor={AppColors.GRAY}
                    textSize={1.4}
                  />
                </View>
              )}
              <LineBreak space={1} />

              {suspendedUntil && (
                <View style={styles.infoRow}>
                  <AppText
                    title="Suspended Until: "
                    textColor={AppColors.BLACK}
                    textSize={1.4}
                    textFontWeight
                  />
                  <AppText
                    title={formatDate(suspendedUntil)}
                    textColor={AppColors.GRAY}
                    textSize={1.4}
                  />
                </View>
              )}
            </View>
          )}
          <LineBreak space={4} />

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <AppText
              title="Got it"
              textColor={AppColors.WHITE}
              textSize={1.8}
              textFontWeight
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: responsiveWidth(88),
    backgroundColor: AppColors.WHITE,
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: AppColors.lightRed,
    padding: 20,
    borderRadius: 50,
  },
  infoBox: {
    width: '100%',
    backgroundColor: AppColors.INPUTBG,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  button: {
    width: '100%',
    height: 60,
    backgroundColor: AppColors.BTNCOLOURS,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuspensionModal;
