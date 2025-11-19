import { ApiCall } from "../../../utils/ApiCall"

export const AddReviews = async(token, data) => {
    try {
    const response = await ApiCall("POST", "addReview", data,token)

    return response.data
  } catch (error) {
    console.log("error.." ,error)
  }
}

export const GetReviews = async(token) => {
  try {
    const response = await ApiCall("GET", "reviews","",token)

    return response.data
  } catch (error) {
    console.log("error.." ,error)
  }
}
