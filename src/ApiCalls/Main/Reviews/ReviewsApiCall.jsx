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
    const response = await ApiCall('GET', 'reviews', '', token);
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

// export const deleteReview = async ({noteId, token}: any) => {
//   try {
//     const data = await axios.post(`${baseUrl}${endPoints.deleteNote}`, {
//       noteId: noteId.toString(),
//     });

//     return data?.data;
//   } catch (error) {
//     return {
//       success: false,
//       message: error?.response?.data?.message || error.message,
//     };
//   }
// };
