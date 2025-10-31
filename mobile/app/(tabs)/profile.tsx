import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          <MaterialCommunityIcons
            name="account"
            size={64}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <Text variant="displaySmall" style={styles.title}>
            Profile
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Coming Soon
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.cardText}>
              Manage your account settings, preferences, and profile information. Customize your
              experience and stay in control.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  surface: {
    padding: 32,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  cardText: {
    opacity: 0.8,
    textAlign: 'center',
  },
});
