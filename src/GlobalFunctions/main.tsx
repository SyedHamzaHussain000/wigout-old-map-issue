import axios from 'axios';
import {baseUrl, endPoints} from '../utils/api_content';

export const updateProfile = async ({
  id,
  fullName,
  nickName,
  image,
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
