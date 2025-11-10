/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useState} from 'react';
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import AppHeader from '../../../components/AppHeader';
import LineBreak from '../../../components/LineBreak';
import AppImages from '../../../assets/images/AppImages';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AppColors from '../../../utils/AppColors';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../../utils/Responsive_Dimensions';
import AppTextInput from '../../../components/AppTextInput';
import AppButton from '../../../components/AppButton';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PhoneInputScreen from '../../../components/PhoneInput';
import {useCustomNavigation} from '../../../utils/Hooks';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {Picker} from '@react-native-picker/picker';
import moment from 'moment';
import {fillProfileValidation} from '../../../utils/Validation';
import {useRoute} from '@react-navigation/native';
import { useSelector } from 'react-redux';

const FillYourProfile = () => {
  const {navigateToRoute} = useCustomNavigation();
  // const userId = useRoute().params?.userId;
  // const token = useRoute().params?.token;

  const token = useSelector((state) => state?.user?.token);
  const userId = useSelector((state) => state?.user?.userData?._id);
    const userData = useSelector((state) => state?.user?.userData);
      const current_location = useSelector((state) => state?.user?.current_location);
  // Alert.alert("userId", userId)

  const [image, setImage] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [gender, setGender] = useState('male');
  const [fullName, setFullName] = useState('');
  const [nickName, setNickName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(new Date());
  const phoneRef = useRef(null);

  const openImagePicker = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
    }).then(image => {
      setImage(image.path);
    });
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = date => {
    setDate(date);
    hideDatePicker();
  };

  const handleContinue = () => {

    

    const number = phoneRef.current.getValue();
    const isValid = fillProfileValidation(
      image,
      date,
      number,
      fullName,
       userData?.email ,
      nickName,
      gender,
    );

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

    if (isValid === true) {
      navigateToRoute('SetLocation', {data: data});
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
      <ScrollView style={{flex: 1, backgroundColor: AppColors.WHITE}}>
        <AppHeader  heading={'Fill Your Profile'} />

        <LineBreak space={4} />

        <View style={{flex: 1, alignItems: 'center'}}>
          <ImageBackground
            source={image ? {uri: image} : AppImages.BG}
            imageStyle={{borderRadius: 100, position: 'relative'}}
            style={{width: 120, height: 120}}>
            <View
              style={{
                position: 'absolute',
                bottom: responsiveHeight(1),
                right: 0,
              }}>
              <TouchableOpacity
                style={{
                  backgroundColor: AppColors.BTNCOLOURS,
                  padding: responsiveWidth(1),
                  borderRadius: 5,
                }}
                onPress={() => openImagePicker()}>
                <MaterialIcons
                  name={'edit'}
                  size={responsiveFontSize(2)}
                  color={AppColors.WHITE}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={date}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

          <LineBreak space={3} />

          <View style={{width: responsiveWidth(87), gap: 20}}>
            <AppTextInput
              inputPlaceHolder={'Full Name'}
              value={fullName}
              onChangeText={text => setFullName(text)}
            />
            <AppTextInput
              inputPlaceHolder={'Nick Name'}
              value={nickName}
              onChangeText={text => setNickName(text)}
            />
            <AppTextInput
              inputPlaceHolder={'Date of Birth'}
              readOnly={true}
              value={moment(date).format('D/M/YYYY')}
              rightIcon={
                <TouchableOpacity onPress={() => showDatePicker()}>
                  <MaterialCommunityIcons
                    name={'calendar-month-outline'}
                    size={responsiveFontSize(2.5)}
                    color={AppColors.BLACK}
                  />
                </TouchableOpacity>
              }
            />
            {/* <AppTextInput
              inputPlaceHolder={'Email'}
              value={email}
              onChangeText={text => setEmail(text)}
              rightIcon={
                <MaterialCommunityIcons
                  name={'email-outline'}
                  size={responsiveFontSize(2.5)}
                  color={AppColors.BLACK}
                />
              }
            /> */}

            <PhoneInputScreen phoneRef={phoneRef}  />

            <View
              style={{
                width: responsiveWidth(85),
                alignItems: 'center',
                backgroundColor: AppColors.inputBg,
                borderRadius: 10,
                alignSelf: 'center',
                paddingLeft: responsiveWidth(4),
              }}>
              <Picker
                selectedValue={gender}
                mode="dropdown"
                dropdownIconColor={AppColors.GRAY}
                style={{
                  width: '100%',
                  color: AppColors.GRAY,
                }}
                onValueChange={itemValue => setGender(itemValue)}>
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>

            <LineBreak space={3} />

            <AppButton
              title={'Continue'}
              textColor={AppColors.WHITE}
              textSize={2}
              btnPadding={18}
              handlePress={() => handleContinue()}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FillYourProfile;
