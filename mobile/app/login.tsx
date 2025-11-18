import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import { enableOfflineMode } from '../src/utils/offlineMode';
import { setCredentials } from '../src/store/slices/authSlice';
import { setActiveHousehold, setCurrentHousehold } from '../src/store/slices/householdSlice';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { signIn, isLoading, error } = useGoogleAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signIn();
      // Navigate to tabs after successful login
      router.replace('/(tabs)');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in');
    }
  };

  const handleOfflineMode = async () => {
    setOfflineLoading(true);
    setLocalError(null);
    try {
      // Enable offline mode and create default user/household
      const { user, household } = await enableOfflineMode();

      // Set credentials in Redux (use 'offline' as token)
      dispatch(
        setCredentials({
          user,
          token: 'offline',
        })
      );

      // Set household in Redux
      dispatch(setActiveHousehold(household.id));
      dispatch(setCurrentHousehold(household));

      console.log('Offline mode activated, navigating to tabs...');

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Offline mode error:', err);
      setLocalError('Failed to enable offline mode');
    } finally {
      setOfflineLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Flatmates App
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Manage todos, shopping lists, and expenses with your flatmates
        </Text>

        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          disabled={isLoading || offlineLoading}
          style={styles.button}
          icon="google"
        >
          Sign in with Google
        </Button>

        <Divider style={styles.divider} />

        <Text variant="bodyMedium" style={styles.offlineText}>
          Backend not available?
        </Text>

        <Button
          mode="outlined"
          onPress={handleOfflineMode}
          loading={offlineLoading}
          disabled={isLoading || offlineLoading}
          style={styles.button}
          icon="cellphone-off"
        >
          Continue in Offline Mode
        </Button>

        <Text variant="bodySmall" style={styles.offlineInfo}>
          Offline mode lets you use the app without a backend. Your data will be stored locally
          and can sync when the backend becomes available.
        </Text>

        {(error || localError) && <Text style={styles.errorText}>{error || localError}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 48,
    textAlign: 'center',
    color: '#999',
  },
  button: {
    width: '100%',
    marginTop: 16,
  },
  divider: {
    width: '100%',
    marginTop: 32,
    marginBottom: 16,
  },
  offlineText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 8,
  },
  offlineInfo: {
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  },
});
