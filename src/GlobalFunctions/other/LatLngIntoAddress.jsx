import axios from 'axios';
import {Google_API_KEY, Google_Base_Url} from '../../utils/api_content';

export default LatLngIntoAddress = async (lat, lng) => {
  try {
    const url = `${Google_Base_Url}geocode/json?latlng=${Number(lat)},${Number(
      lng,
    )}&key=${Google_API_KEY}`;
    const res = await axios.get(url);
    console.log('res in LatLngIntoAddress:-', res?.data);

    return res?.data.results[0]?.formatted_address;
  } catch (error) {
    console.log(
      'Error in LatLngIntoAddress:-',
      error?.response?.data || error.message || error,
    );
  }
};
