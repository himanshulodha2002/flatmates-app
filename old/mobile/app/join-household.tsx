import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useJoinHouseholdMutation } from '@/store/services/householdApi';
import { useDispatch } from 'react-redux';
import { setActiveHousehold } from '@/store/slices/householdSlice';

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [token, setToken] = useState('');
  const [joinHousehold, { isLoading }] = useJoinHouseholdMutation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleJoin = async () => {
    if (!token.trim()) {
      setSnackbarMessage('Please enter an invite token');
      setSnackbarVisible(true);
      return;
    }

    try {
      const result = await joinHousehold({ token: token.trim() }).unwrap();
      dispatch(setActiveHousehold(result.id));
      setSnackbarMessage('Successfully joined household!');
      setSnackbarVisible(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to join household');
      setSnackbarVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Join a Household
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter the invite token you received to join an existing household.
        </Text>

        <TextInput
          label="Invite Token"
          value={token}
          onChangeText={setToken}
          mode="outlined"
          style={styles.input}
          placeholder="Paste your invite token here"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          mode="contained"
          onPress={handleJoin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Join Household
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          disabled={isLoading}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#b0b0b0',
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});
