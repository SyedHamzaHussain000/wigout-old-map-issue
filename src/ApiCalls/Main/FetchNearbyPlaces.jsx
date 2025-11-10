import { View, Text, Alert } from 'react-native'
import React from 'react'
import axios from 'axios';
import { Google_API_KEY, Google_Base_Url } from '../../utils/api_content';
import { setNearbyPlaces } from '../../redux/Slices';

const FetchNearbyPlaces = async (location, dispatch) => {

    try {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${Google_Base_Url}place/nearbysearch/json?location=${location?.latitude},${location.longitude}&radius=1000&type=restaurant&key=${Google_API_KEY}`,
            headers: {},
        };
        
        const result = await axios.request(config)
        console.log("res", result.data.results);
        dispatch(setNearbyPlaces(result.data.results))

        return result.data.results

    } catch (error) {

        console.log("Google url", `${Google_Base_Url}place/nearbysearch/json?location=${location?.latitude},${location.longitude}&radius=1000&type=restaurant&key=${Google_API_KEY}`)
            console.log("error in FetchNearbyPlaces". error)

    }
    
}

export default FetchNearbyPlaces