import axios from 'axios';
import {Google_API_KEY, Google_Base_Url} from '../../utils/api_content';
import {setNearbyPlaces} from '../../redux/Slices';

const FetchNearbyPlaces = async (
  location,
  dispatch,
  type = 'restaurant',
  keyword = '',
  customAction = null,
) => {
  // If type is 'all' or empty, we omit the type parameter to get a broad set of results
  // const typeParam = type && type !== 'all' ? `&type=${type}` : '';
  // const keywordParam = keyword ? `&keyword=${keyword}` : '';
  const typeParam =
    type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : '';
  const keywordParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';

  let url = `${Google_Base_Url}place/nearbysearch/json?location=${location?.latitude},${location.longitude}&radius=160000${typeParam}${keywordParam}&key=${Google_API_KEY}`;

  console.log('url of FetchNearbyPlaces:-', url);
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: url,
      headers: {},
    };

    const result = await axios.request(config);
    const results = result.data.results || [];
    if (customAction === 'skip') {
      // Do nothing, just return results
    } else if (customAction) {
      dispatch(customAction(results));
    } else if (dispatch) {
      dispatch(setNearbyPlaces(results));
    }

    return results;
  } catch (error) {
    console.log('error in FetchNearbyPlaces', error);
    dispatch(setNearbyPlaces([]));
    return [];
  }
};

export default FetchNearbyPlaces;
