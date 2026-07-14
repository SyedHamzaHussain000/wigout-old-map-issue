import {Google_API_KEY} from '../../utils/api_content';

export const GetPlaceName = async (latitude, longitude) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Google_API_KEY}`;
  console.log('url:-', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('error_message:-', data?.error_message);
    if (data.status === 'OK' && data.results.length > 0) {
      const formattedAddress =
        data.results[0].formatted_address || 'Address not found';

      return formattedAddress;
    } else {
      return 'Address not found or API error.';
    }
  } catch (error) {
    console.error('GetPlaceName error:-', error);
  }
};
