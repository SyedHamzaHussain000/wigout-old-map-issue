import {View, Text, Alert} from 'react-native';
import React from 'react';
import axios from 'axios';
import BASE_URL from './BASE_URL';

export const ApiCall = async (method, endpoint, data, token = null) => {
  try {
    let config = {
      method: method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && {Authorization: `Bearer ${token}`}), // add token only if exists
      },
      data: data ? data : '',
    };
    const res = await axios(config); // ✅ use axios or axios.request
    return res;
  } catch (error) {
    return error;
  }
};

export const ApiCallWithUserId = async (
  method,
  endpoint,
  userId,
  data,
  token = null,
) => {
  try {
    let config = {
      method: method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && {Authorization: `Bearer ${token}`}), // add token only if exists
      },
      data: data ? data : '',
    };

    const res = await axios(config);
    return res.data;
  } catch (error) {
    console.log(`error api call by userid and api name is ${endpoint}`, error);

    return error;
  }
};
