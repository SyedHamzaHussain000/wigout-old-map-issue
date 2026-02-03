/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useState} from 'react';
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';
import moment from 'moment';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {Picker} from '@react-native-picker/picker';

import AppHeader from '../../../components/AppHeader';
import LineBreak from '../../../components/LineBreak';
import AppImages from '../../../assets/images/AppImages';
import AppColors from '../../../utils/AppColors';
import AppTextInput from '../../../components/AppTextInput';
import AppButton from '../../../components/AppButton';
import PhoneInputScreen from '../../../components/PhoneInput';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';

import {useCustomNavigation} from '../../../utils/Hooks';
import {fillProfileValidation} from '../../../utils/Validation';

const FillYourProfile = () => {
  const {navigateToRoute} = useCustomNavigation();
  const phoneRef = useRef(null);

  const token = useSelector(state => state?.user?.token);
  const userId = useSelector(state => state?.user?.userData?._id);
  const userData = useSelector(state => state?.user?.userData);

  const [image, setImage] = useState('');
  const [date, setDate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickName, setNickName] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const openImagePicker = async () => {
    try {
      const pickedImage = await ImagePicker.openPicker({
        width: 300,
        height: 400,
        cropping: true,
      });
      setImage(pickedImage?.path || '');
    } catch (error) {
      // User cancelled picker — safe to ignore
    }
  };

  const handleConfirmDate = selectedDate => {
    setDate(selectedDate);
    setDatePickerVisibility(false);
  };

  const handleContinue = () => {
    const number = phoneRef.current?.getValue?.() || '';

    const isValid = fillProfileValidation(
      image,
      fullName,
      nickName,
      date,
      userData?.email,
      number,
      gender,
    );

    if (!isValid) {
      return;
    }

    const data = {
      image,
      date: moment(date).format('D/M/YYYY'),
      number,
      email: userData?.email,
      fullName,
      nickName,
      gender,
      userId,
      token,
    };

    navigateToRoute('SetLocation', {data});
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{flex: 1, backgroundColor: AppColors.WHITE}}
        showsVerticalScrollIndicator={false}>
        <AppHeader heading="Fill Your Profile" />
        <LineBreak space={4} />

        <View style={{alignItems: 'center'}}>
          {/* Profile Image */}
          <ImageBackground
            source={image ? {uri: image} : AppImages.BG}
            imageStyle={{borderRadius: 100}}
            style={{width: 120, height: 120}}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: responsiveHeight(1),
                right: 0,
                backgroundColor: AppColors.BTNCOLOURS,
                padding: responsiveWidth(1),
                borderRadius: 6,
              }}
              onPress={openImagePicker}>
              <MaterialIcons
                name="edit"
                size={responsiveFontSize(2)}
                color={AppColors.WHITE}
              />
            </TouchableOpacity>
          </ImageBackground>

          {/* Date Picker */}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={date}
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
          />

          <LineBreak space={3} />

          <View style={{width: responsiveWidth(87), gap: 20}}>
            <AppTextInput
              inputPlaceHolder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <AppTextInput
              inputPlaceHolder="Nick Name"
              value={nickName}
              onChangeText={setNickName}
            />

            <AppTextInput
              inputPlaceHolder="Date of Birth"
              value={moment(date).format('D/M/YYYY')}
              readOnly
              rightIcon={
                <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={responsiveFontSize(2.5)}
                    color={AppColors.BLACK}
                  />
                </TouchableOpacity>
              }
            />

            <PhoneInputScreen phoneRef={phoneRef} />

            {/* Gender Picker */}
            <View
              style={{
                width: responsiveWidth(85),
                backgroundColor: AppColors.inputBg,
                borderRadius: 10,
                paddingLeft: responsiveWidth(4),
              }}>
              <Picker
                selectedValue={gender}
                dropdownIconColor={AppColors.GRAY}
                style={{color: AppColors.BLACK}}
                placeholder="Select Gender"
                onValueChange={setGender}>
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>

            <LineBreak space={3} />

            <AppButton
              title="Continue"
              textColor={AppColors.WHITE}
              textSize={2}
              btnPadding={18}
              handlePress={handleContinue}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FillYourProfile;
