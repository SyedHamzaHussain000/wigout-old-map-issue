import axios from 'axios';
import { Google_API_KEY, Google_Base_Url } from '../../utils/api_content';

export default LatLngIntoAddress = async (lat, lng) => {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${Google_Base_Url}geocode/json?latlng=${lat},${lng}&key=${Google_API_KEY}`,
      headers: {},
    };

    const res = await axios.request(config);
    
    return res?.data.results[0]?.formatted_address;
  } catch (error) {}
}
