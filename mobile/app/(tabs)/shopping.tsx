import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ShoppingScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          <MaterialCommunityIcons
            name="cart"
            size={64}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <Text variant="displaySmall" style={styles.title}>
            Shopping Lists
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Coming Soon
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.cardText}>
              Create and share shopping lists with your flatmates. Never forget what you need to
              buy and coordinate shopping trips efficiently.
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
