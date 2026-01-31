import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateHouseholdMutation } from '@/store/services/householdApi';
import { useDispatch } from 'react-redux';
import { setActiveHousehold } from '@/store/slices/householdSlice';

export default function CreateHouseholdScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [createHousehold, { isLoading }] = useCreateHouseholdMutation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setSnackbarMessage('Please enter a household name');
      setSnackbarVisible(true);
      return;
    }

    try {
      const result = await createHousehold({ name: name.trim() }).unwrap();
      dispatch(setActiveHousehold(result.id));
      setSnackbarMessage('Household created successfully!');
      setSnackbarVisible(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to create household');
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
          Create a Household
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Set up a household to manage tasks, shopping, and expenses with your flatmates.
        </Text>

        <TextInput
          label="Household Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., My Apartment, Baker Street Flat"
          maxLength={100}
        />

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Create Household
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
