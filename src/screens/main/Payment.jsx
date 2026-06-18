/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components & Utils (Aapki styling architecture ke mutabiq)
import ScreenWrapper from '../../components/ScreenWrapper';
import AppHeader from '../../components/AppHeader';
import AppText from '../../components/AppTextComps/AppText';
import AppColors from '../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive_Dimensions';

const Payment = ({navigation}) => {
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  // 💳 Card Number Formatter (Har 4 digits ke baad automatic space lagayega)
  const handleCardNumberChange = text => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setAccountNumber(match ? match.join(' ') : cleaned);
  };

  // 📅 Expiry Date Formatter (MM/YY format automate karega)
  const handleExpiryChange = text => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handlePayNow = () => {
    if (!accountTitle.trim() || !accountNumber || !expiry || !cvv) {
      Alert.alert('Validation Error', 'Please fill in all credit card fields.');
      return;
    }

    if (accountNumber.replace(/\s/g, '').length < 16) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 16-digit card number.',
      );
      return;
    }

    if (cvv.length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid CVV.');
      return;
    }

    setLoading(true);

    // Simulating API integration or processing mechanism
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Payment Success',
        'Your microtransaction has been processed successfully!',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    }, 2000);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerWrapper}>
        <AppHeader onBackPress={true} heading="Checkout & Payment" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Card Meta Container Visual Simulation */}
          <View style={styles.creditCardVisual}>
            <View style={styles.cardRow}>
              <Ionicons name="card" size={36} color={AppColors.WHITE} />
              <AppText
                title="VISA / MASTERCARD"
                textColor={AppColors.WHITE}
                textSize={1.4}
                textFontWeight
              />
            </View>
            <View style={{marginVertical: 15}}>
              <AppText
                title={accountNumber || '•••• •••• •••• ••••'}
                textColor={AppColors.WHITE}
                textSize={2.2}
                textAlignment="center"
              />
            </View>
            <View style={[styles.cardRow, {alignItems: 'flex-end'}]}>
              <View style={{flex: 1}}>
                <AppText
                  title="CARD HOLDER"
                  textColor="rgba(255,255,255,0.6)"
                  textSize={1.1}
                />
                <AppText
                  title={accountTitle.toUpperCase() || 'YOUR NAME'}
                  textColor={AppColors.WHITE}
                  textSize={1.4}
                  numberOfLines={1}
                />
              </View>
              <View>
                <AppText
                  title="EXPIRES"
                  textColor="rgba(255,255,255,0.6)"
                  textSize={1.1}
                />
                <AppText
                  title={expiry || 'MM/YY'}
                  textColor={AppColors.WHITE}
                  textSize={1.4}
                />
              </View>
            </View>
          </View>

          {/* Form Input Fields Container */}
          <View style={styles.formContainer}>
            {/* Account Title Input */}
            <View style={styles.inputBlock}>
              <AppText
                title="Account Title / Cardholder Name"
                textColor="#47082E"
                textSize={1.4}
                textFontWeight
              />
              <TextInput
                style={styles.inputField}
                placeholder="e.g. John Doe"
                placeholderTextColor="#999"
                value={accountTitle}
                onChangeText={setAccountTitle}
                autoCapitalize="words"
              />
            </View>

            {/* Account Number Input */}
            <View style={styles.inputBlock}>
              <AppText
                title="Account / Card Number"
                textColor="#47082E"
                textSize={1.4}
                textFontWeight
              />
              <TextInput
                style={styles.inputField}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={19} // 16 digits + 3 spaces
                value={accountNumber}
                onChangeText={handleCardNumberChange}
              />
            </View>

            {/* Row structure for dynamic inline sub-inputs */}
            <View style={styles.rowInputs}>
              {/* Expires Input */}
              <View style={[styles.inputBlock, {flex: 1}]}>
                <AppText
                  title="Expires"
                  textColor="#47082E"
                  textSize={1.4}
                  textFontWeight
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5} // MM/YY
                  value={expiry}
                  onChangeText={handleExpiryChange}
                />
              </View>

              {/* CVV Input */}
              <View style={[styles.inputBlock, {flex: 1}]}>
                <AppText
                  title="CVV"
                  textColor="#47082E"
                  textSize={1.4}
                  textFontWeight
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="123"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={true}
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
          </View>

          {/* Pay Now Interactive Execution Button */}
          <TouchableOpacity
            style={[styles.payButton, loading && {backgroundColor: '#ccc'}]}
            onPress={handlePayNow}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="small" color={AppColors.WHITE} />
            ) : (
              <AppText
                title="Pay Now ($3.00)"
                textColor={AppColors.WHITE}
                textSize={1.8}
                textFontWeight
              />
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Payment;

const styles = StyleSheet.create({
  headerWrapper: {paddingBottom: 5},
  container: {flex: 1},
  scrollContent: {
    paddingBottom: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(5),
  },
  creditCardVisual: {
    backgroundColor: '#47082E', // Theme base brand matching gradient representation color
    borderRadius: 18,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: 10,
    gap: 15,
  },
  inputBlock: {
    gap: 6,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(71, 8, 46, 0.15)',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 15,
    fontSize: responsiveFontSize(1.6),
    color: '#000000',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 15,
  },
  payButton: {
    backgroundColor: '#EB864D', // Call to Action button brand accent tint matching mapping configurations
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    shadowColor: '#EB864D',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
