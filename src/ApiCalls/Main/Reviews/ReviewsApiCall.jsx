import {endPoints} from '../../../utils/api_content';
import {ApiCall} from '../../../utils/ApiCall';

export const AddReviews = async (token, data) => {
  try {
    const response = await ApiCall('POST', 'addReview', data, token);

    return response.data;
  } catch (error) {
    console.log('error..', error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        'Something went wrong',
    };
  }
};

export const updateReviews = async (token, data) => {
  try {
    const response = await ApiCall(
      'PUT',
      `updateReview/${data?.reviewId}`,
      data,
      token,
    );

    return response.data;
  } catch (error) {
    console.log('error..', error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        'Something went wrong',
    };
  }
};

export const GetReviews = async token => {
  // console.log('TOKEN:-', token);
  try {
    const response = await ApiCall('GET', 'getUserReview', '', token);
    // console.log('res in GetReviews:-', response?.data?.msg);

    return response.data;
  } catch (error) {
    console.log('error in GetReviews:-', error);
  }
};

export const GetReviewsByPlaceId = async (token, placeId) => {
  // console.log('TOKEN:-', token);
  // console.log('placeId:-', placeId);
  try {
    const response = await ApiCall(
      'GET',
      `reviews?placeId=${placeId}`,
      '',
      token,
    );
    // console.log('res in GetReviewsByPlaceId:-', response?.data);

    return response.data;
  } catch (error) {
    console.log('error in GetReviewsByPlaceId:-', error);
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
