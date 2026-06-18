import axios from 'axios';
import {Google_API_KEY, Google_Base_Url} from '../../utils/api_content';

const LatLngIntoAddress = async (lat, lng) => {
  try {
    // 1. Coordinates ko safe string mein convert karein aur fix karein (6 decimal places tak)
    // Is se extra long floating numbers clean ho jate hain
    const cleanLat = Number(lat).toFixed(6);
    const cleanLng = Number(lng).toFixed(6);

    // 2. Pure parameter ko proper URL format mein encode karein
    const latLngParam = encodeURIComponent(`${cleanLat},${cleanLng}`);

    // 3. Final URL construct karein
    const url = `${Google_Base_Url}geocode/json?latlng=${latLngParam}&key=${Google_API_KEY}`;

    console.log('LatLngIntoAddress URL:-', url);

    try {
      const fetchRes = await fetch(url);
      const fetchJson = await fetchRes.json();
      console.log('Test fetch Google API success:', fetchJson ? 'Yes' : 'No');
    } catch (e) {
      console.log('Test fetch Google API failed:', e.message);
    }

    const res = await axios.get(url);
    console.log('res in LatLngIntoAddress:-', res?.data);

    // Agar key ka abhi bhi koi masla hoga, toh Google yahan batayega
    if (res?.data?.status === 'REQUEST_DENIED') {
      console.log('Google API Restriction Error:', res?.data?.error_message);
    }

    return res?.data?.results[0]?.formatted_address || 'Address not found';
  } catch (error) {
    console.log('Error in LatLngIntoAddress detail:', {
      message: error.message,
      code: error.code,
      config: error.config,
      request: error.request
        ? {
            status: error.request.status,
            readyState: error.request.readyState,
            response: error.request.response,
            _response: error.request._response,
          }
        : null,
    });
    return null;
  }
};

export default LatLngIntoAddress;

// import axios from 'axios';
// import {Google_API_KEY, Google_Base_Url} from '../../utils/api_content';

// export default LatLngIntoAddress = async (lat, lng) => {
//   try {
//     const url = `${Google_Base_Url}geocode/json?latlng=${Number(lat)},${Number(
//       lng,
//     )}&key=${Google_API_KEY}`;
//     const res = await axios.get(url);
//     console.log('res in LatLngIntoAddress:-', res?.data);

//     return res?.data.results[0]?.formatted_address;
//   } catch (error) {
//     console.log(
//       'Error in LatLngIntoAddress:-',
//       error?.response?.data || error.message || error,
//     );
//   }
// };
