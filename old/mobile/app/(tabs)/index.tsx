import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, useTheme } from 'react-native-paper';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OfflineBanner />
      <View style={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome to Flatmates
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your collaborative app for managing shared living
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Get Started
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Manage todos, shopping lists, and expenses with your flatmates all in one place.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Features
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              • Shared Todo Lists{'\n'}• Collaborative Shopping Lists{'\n'}• Expense Tracking &
              Splitting{'\n'}• Real-time Updates
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
    padding: 24,
    borderRadius: 12,
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
  cardTitle: {
    marginBottom: 8,
  },
  cardText: {
    opacity: 0.8,
  },
});
