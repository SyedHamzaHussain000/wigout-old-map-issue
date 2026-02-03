import axios from 'axios';
import {baseUrl, endPoints} from '../utils/api_content';

export const signUp = async ({email, password}: any) => {
  try {
    const data = await axios.post(`${baseUrl}${endPoints.signUp}`, {
      email: email.toString()?.toLowerCase(),
      password: password.toString(),
    });
    console.log('DATA in signUp:-', data);

    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const signIn = async ({email, password}: any) => {
  try {
    const data = await axios.post(`${baseUrl}${endPoints.signIn}`, {
      email: email.toString()?.toLowerCase(),
      password: password.toString(),
    });
    console.log('DATA in signIn:-', data);
    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const createProfile = async ({
  id,
  fullName,
  nickName,
  image,
  locationName,
  gender,
  number,
  date,
}: any) => {
  try {
    let fields = new FormData();
    fields.append('userId', id);
    fields.append('fullName', fullName);
    fields.append('nickName', nickName);
    fields.append('DOB', date);
    fields.append('phone', number);
    fields.append('gender', gender);
    // fields.append('longitude', '-73.9855');
    // fields.append('latitude', '40.7580');
    fields.append('locationName', locationName);
    fields.append('profileImage', {
      uri: image,
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${baseUrl}${endPoints.createProfile}`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: fields,
    };

    const data = await axios.request(config);

    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const forgotPassword = async ({email}: any) => {
  try {
    const data = await axios.post(`${baseUrl}${endPoints.forgotPassword}`, {
      email: email.toString(),
    });

    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const verifyOtpForResetPassword = async ({email, otp}: any) => {
  try {
    const data = await axios.post(`${baseUrl}${endPoints.verifyOtp}`, {
      email: email.toString(),
      OTP: otp,
    });

    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const resetPassword = async ({userId, newPassword}: any) => {
  try {
    const data = await axios.post(`${baseUrl}${endPoints.resetPassword}`, {
      userId: userId.toString(),
      newPassword: newPassword.toString(),
    });

    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};
