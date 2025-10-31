import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  clearCredentials,
} from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/services/authApi';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Call backend logout endpoint
            await logout().unwrap();

            // Sign out from Google
            await GoogleSignin.signOut();

            // Clear Redux state
            dispatch(clearCredentials());

            // Navigate to login
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            // Even if backend call fails, clear local state
            dispatch(clearCredentials());
            await GoogleSignin.signOut().catch(() => {});
            router.replace('/login');
          }
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Text>Not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          {user.profile_picture_url ? (
            <Avatar.Image
              size={80}
              source={{ uri: user.profile_picture_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={80} icon="account" style={styles.avatar} />
          )}
          <Text variant="headlineMedium" style={styles.title}>
            {user.full_name}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user.email}
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Household
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push('/household-switcher')}
              style={styles.householdButton}
              icon="home-group"
            >
              My Households
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/members')}
              style={styles.householdButton}
              icon="account-group"
            >
              View Members
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Account Information
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status:</Text>
              <Text style={styles.infoValue}>{user.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>{new Date(user.created_at).toLocaleDateString()}</Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          loading={isLoading}
          disabled={isLoading}
          style={styles.logoutButton}
          icon="logout"
        >
          Logout
        </Button>
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
  avatar: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: '500',
  },
  householdButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
});
