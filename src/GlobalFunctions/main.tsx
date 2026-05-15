import axios from 'axios';
import {baseUrl, endPoints} from '../utils/api_content';

export const updateProfile = async ({
  id,
  fullName,
  nickName,
  image,
  gender,
  number,
  date,
}: any) => {
  try {
    let data = new FormData();
    data.append('userId', id);
    data.append('fullName', fullName);
    data.append('nickName', nickName);
    data.append('DOB', date);
    data.append('phone', number);
    data.append('gender', gender);

    // Only upload the image if it's a new local file
    if (
      image &&
      (image.startsWith('file://') ||
        image.startsWith('content://') ||
        image.startsWith('/'))
    ) {
      data.append('profileImage', {
        uri: image,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as any);
    }

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${baseUrl}${endPoints.createProfile}`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: data,
    };

    const res = await axios.request(config);

    return res?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const getAllNotifications = async (token: string) => {
  try {
    const data = await axios.get(`${baseUrl}${endPoints.getAllNotifications}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const notifyUserForNearbyReviewedPlaces = async (
  token: string,
  latitude: number,
  longitude: number,
) => {
  const data = {
    latitude: latitude,
    longitude: longitude,
  };
  console.log('API Request Data (notifyUser):-', data);
  try {
    const response = await axios.post(
      `${baseUrl}${endPoints.notifyUser}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log('Notify API Response:-', response?.data);
    return response?.data;
  } catch (error: any) {
    console.log('Notify API Error Details:-', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const getAllSubscribedUsers = async (
  token: string,
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const data = await axios.get(
      `${baseUrl}${endPoints.getAllSubscribedUsers}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return data?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const shareListing = async (
  token: string,
  recipientId: string,
  params: {
    isAll?: boolean;
    isWishlist?: boolean;
    isAvoid?: boolean;
    isGoAgain?: boolean;
  },
) => {
  try {
    const {isAll, isWishlist, isAvoid, isGoAgain} = params;
    let url = `${baseUrl}${endPoints.shareMyListing}?`;

    if (isAll) {
      url += `isAll=${isAll}&`;
    }
    if (isWishlist) {
      url += `isWishlist=${isWishlist}&`;
    }
    if (isAvoid) {
      url += `isAvoid=${isAvoid}&`;
    }
    if (isGoAgain) {
      url += `isGoAgain=${isGoAgain}&`;
    }

    // Remove trailing & or ?
    if (url.endsWith('&') || url.endsWith('?')) {
      url = url.slice(0, -1);
    }

    const data = {recipientId};

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const GetSharedList = async (
  token: string,
  ids: {
    wishlistIds: string[];
    avoidIds: string[];
    goAgainIds: string[];
  },
) => {
  try {
    const response = await axios.post(
      `${baseUrl}${endPoints.getSharedListingsDetails}`,
      ids,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response?.data;
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message,
    };
  }
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  // console.log('Detected Hour for Greeting:', hour);
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};
