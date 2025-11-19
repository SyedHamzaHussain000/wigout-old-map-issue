import { View, Text, Platform, ToastAndroid, Alert } from 'react-native'
import React from 'react'

const ShowError = (title, duration) => {

    if(Platform.OS == "android"){
        ToastAndroid.show(title, duration)
    }else{
         Alert.alert(title)
    }
}

export default ShowError