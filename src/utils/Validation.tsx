import {ShowToast} from './api_content';

export const signUpAndSignInFormValidation = (
  email: string,
  password: string,
) => {
  // Email required
  if (!email) {
    return ShowToast('error', 'Email is required');
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ShowToast('error', 'Enter a valid email address');
  }

  // Password required
  if (!password) {
    return ShowToast('error', 'Password is required');
  }

  // Password length (min 6)
  if (password.length < 6) {
    return ShowToast('error', 'Password must be at least 6 characters');
  }

  return true; // ✅ Passed validation
};

export const fillProfileValidation = (
  image: string,
  fullName: string,
  nickName: string,
  date: string,
  email: string,
  number: string,
  gender: string,
) => {
  if (!image) {
    return ShowToast('error', 'Image is required');
  }

  if (!fullName) {
    return ShowToast('error', 'Full Name is required');
  }

  if (!nickName) {
    return ShowToast('error', 'Nick Name is required');
  }

  if (!date) {
    return ShowToast('error', 'Date is required');
  }

  if (!email) {
    return ShowToast('error', 'Email is required');
  }

  if (!number) {
    return ShowToast('error', 'Phone Number is required');
  }

  if (!gender) {
    return ShowToast('error', 'Gender is required');
  }

  return true;
};
