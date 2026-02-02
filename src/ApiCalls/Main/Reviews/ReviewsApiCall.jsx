import {endPoints} from '../../../utils/api_content';
import {ApiCall} from '../../../utils/ApiCall';

export const AddReviews = async (token, data) => {
  try {
    const response = await ApiCall('POST', 'addReview', data, token);

    return response.data;
  } catch (error) {
    console.log('error..', error);
  }
};

export const GetReviews = async token => {
  try {
    const response = await ApiCall('GET', 'getUserReview', '', token);
    console.log('resss', response.message);

    return response.data;
  } catch (error) {
    console.log('error..', error);
  }
};

export const addNote = async (data, token) => {
  try {
    const response = await ApiCall('POST', 'addNoteOnReview', data, token);

    return response?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const RemoveReview = async (data, token) => {
  try {
    const url = `deleteReview?reviewId=${data?.reviewId}`;
    const response = await ApiCall('DELETE', url, {}, token);

    return response?.data || response;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};
