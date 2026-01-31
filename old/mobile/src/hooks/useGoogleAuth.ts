import { useState } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { useGoogleLoginMutation } from '../store/services/authApi';
import { setCredentials } from '../store/slices/authSlice';

// Note: GoogleSignin is a native module. We load and configure it dynamically
// at runtime on native platforms to avoid bundling/linking errors on web.

export const useGoogleAuth = () => {
  const dispatch = useDispatch();
  const [googleLogin] = useGoogleLoginMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        // Web does not support the native GoogleSignin module. Recommend
        // using `expo-auth-session` / `expo-google-auth-session` or run on
        // a native custom dev client.
        throw new Error(
          'Google Sign-In native module is not available on web. Use expo-auth-session or run on a native custom dev client.'
        );
      }

      // Dynamically import native GoogleSignin to avoid bundling it for web
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        offlineAccess: true,
      });

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
