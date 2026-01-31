import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Button, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useGetMyHouseholdsQuery } from '@/store/services/householdApi';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveHousehold, selectActiveHouseholdId } from '@/store/slices/householdSlice';

export default function HouseholdSwitcherScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const { data: households, isLoading } = useGetMyHouseholdsQuery();

  const handleSelectHousehold = (householdId: string) => {
    dispatch(setActiveHousehold(householdId));
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          My Households
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Select a household to switch to
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {households && households.length > 0 ? (
          households.map((household) => (
            <React.Fragment key={household.id}>
              <List.Item
                title={household.name}
                description={`${household.member_count || 0} member${
                  household.member_count !== 1 ? 's' : ''
                }`}
                left={(props) => <List.Icon {...props} icon="home" />}
                right={(props) =>
                  activeHouseholdId === household.id ? (
                    <List.Icon {...props} icon="check" color="#4CAF50" />
                  ) : null
                }
                onPress={() => handleSelectHousehold(household.id)}
                style={activeHouseholdId === household.id ? styles.activeItem : styles.item}
              />
              <Divider />
            </React.Fragment>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No households yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create or join a household to get started
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.push('/create-household')}
          style={styles.button}
          icon="plus"
        >
          Create Household
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.push('/join-household')}
          style={styles.button}
          icon="account-plus"
        >
          Join Household
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 5,
    color: '#ffffff',
  },
  subtitle: {
    color: '#b0b0b0',
  },
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: '#1E1E1E',
  },
  activeItem: {
    backgroundColor: '#2A2A2A',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#b0b0b0',
    textAlign: 'center',
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  button: {
    marginVertical: 5,
  },
});
