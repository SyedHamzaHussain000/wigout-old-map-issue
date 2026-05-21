import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';

// Components
import AppHeader from '../../../components/AppHeader';
import ScreenWrapper from '../../../components/ScreenWrapper';
import AppText from '../../../components/AppTextComps/AppText';
import AppTextInput from '../../../components/AppTextInput';
import AppButton from '../../../components/AppButton';
import LineBreak from '../../../components/LineBreak';

import AppColors from '../../../utils/AppColors';
import {
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import {support} from '../../../GlobalFunctions/main';
import {ShowToast} from '../../../utils/api_content';

const CustomerService = ({navigation}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const token = useSelector(state => state.user.token);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      ShowToast('error', 'Subject is required');
      return;
    }
    if (!message.trim()) {
      ShowToast('error', 'Message is required');
      return;
    }

    setLoading(true);
    try {
      const res = await support({
        token,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (res?.success) {
        ShowToast(
          'success',
          res?.msg || 'Support request submitted successfully!',
        );
        setSubject('');
        setMessage('');
        navigation.goBack();
      } else {
        ShowToast('error', res?.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      ShowToast('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenWrapper>
        <AppHeader
          onBackPress={() => navigation?.goBack()}
          heading="Customer Service"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LineBreak space={3} />

          <View style={styles.horizontalPadding}>
            <AppText
              title="We're here to help!"
              textColor={AppColors.BLACK}
              textSize={2.6}
              textFontWeight
            />
            <LineBreak space={1.5} />
            <AppText
              title="If you have any questions or are experiencing any issues, please submit a request below and our support team will get back to you shortly."
              textColor={AppColors.blackOpacity}
              textSize={1.6}
            />
          </View>

          <LineBreak space={4} />

          <View style={styles.formContainer}>
            <AppTextInput
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              onFocus={() => setFocusedField('subject')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'subject'}
            />

            <AppTextInput
              placeholder="How can we help you today? Please describe your issue in detail..."
              value={message}
              onChangeText={setMessage}
              onFocus={() => setFocusedField('message')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'message'}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              containerStyle={styles.textAreaContainer}
              style={styles.textArea}
            />

            <LineBreak space={3} />

            <AppButton
              title="Submit Request"
              loading={loading}
              handlePress={handleSubmit}
              btnPadding={18}
            />
          </View>

          <LineBreak space={4} />
        </ScrollView>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveHeight(3),
  },
  horizontalPadding: {
    paddingHorizontal: responsiveWidth(5),
  },
  formContainer: {
    width: responsiveWidth(90),
    marginHorizontal: responsiveWidth(5),
    gap: 20,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 12 : 5,
    minHeight: responsiveHeight(18),
  },
  textArea: {
    textAlignVertical: 'top',
    height: responsiveHeight(15),
    paddingTop: Platform.OS === 'ios' ? 0 : 5,
  },
  messageIcon: {
    marginTop: Platform.OS === 'ios' ? 8 : 4,
  },
});

export default CustomerService;
