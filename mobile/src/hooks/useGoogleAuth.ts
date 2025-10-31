import { useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useDispatch } from 'react-redux';
import { useGoogleLoginMutation } from '../store/services/authApi';
import { setCredentials } from '../store/slices/authSlice';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  offlineAccess: true,
});

export const useGoogleAuth = () => {
  const dispatch = useDispatch();
  const [googleLogin] = useGoogleLoginMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send token to backend for verification
      const response = await googleLogin({ id_token: userInfo.idToken }).unwrap();

      // Store credentials in Redux
      dispatch(
        setCredentials({
          user: response.user,
          token: response.access_token,
        })
      );

      return response;
    } catch (err: any) {
      const errorMessage = err?.message || err?.data?.detail || 'Failed to sign in with Google';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
    error,
  };
};
