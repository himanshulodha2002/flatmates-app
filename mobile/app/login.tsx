import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error } = useGoogleAuth();
  const [localError, setLocalError] = useState<string | null>(null);

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
          disabled={isLoading}
          style={styles.button}
          icon="google"
        >
          Sign in with Google
        </Button>

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
  errorText: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  },
});
