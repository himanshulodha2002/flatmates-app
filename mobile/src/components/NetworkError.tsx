import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Network Error component for displaying connection issues
 */
export function NetworkError({
  message = 'Unable to connect to the server. Please check your internet connection.',
  onRetry,
  showRetry = true,
}: NetworkErrorProps) {
  return (
    <Surface style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={48} color="#CF6679" style={styles.icon} />
      <Text variant="titleMedium" style={styles.title}>
        Connection Error
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      {showRetry && onRetry && (
        <Button mode="contained" onPress={onRetry} icon="refresh" style={styles.button}>
          Retry
        </Button>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});
