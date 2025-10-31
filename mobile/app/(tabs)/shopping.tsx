import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Surface, 
  Text, 
  Card, 
  FAB, 
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetShoppingListsQuery, useCreateShoppingListMutation } from '@/store/services/shoppingApi';
import type { ShoppingListSummary } from '@/types';

export default function ShoppingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [listName, setListName] = useState('');
  
  const { data: lists, isLoading, refetch, error } = useGetShoppingListsQuery();
  const [createList, { isLoading: isCreating }] = useCreateShoppingListMutation();

  const handleCreateList = async () => {
    if (listName.trim()) {
      try {
        await createList({ name: listName.trim() }).unwrap();
        setListName('');
        setDialogVisible(false);
      } catch (err) {
        console.error('Failed to create list:', err);
      }
    }
  };

  const handleListPress = (listId: string) => {
    router.push(`/shopping/${listId}` as any);
  };

  const renderListItem = ({ item }: { item: ShoppingListSummary }) => {
    const completionRate = item.item_count > 0 
      ? Math.round((item.purchased_count / item.item_count) * 100)
      : 0;

    return (
      <Card style={styles.card} onPress={() => handleListPress(item.id)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.name}
              </Text>
            </View>
            <Chip mode="outlined" compact>
              {item.item_count} items
            </Chip>
          </View>
          
          {item.item_count > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${completionRate}%`,
                      backgroundColor: theme.colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text variant="bodySmall" style={styles.progressText}>
                {item.purchased_count} of {item.item_count} purchased
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (error && 'status' in error && error.status === 403) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Surface style={styles.surface} elevation={1}>
            <MaterialCommunityIcons
              name="home-alert"
              size={64}
              color={theme.colors.error}
              style={styles.icon}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Household
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              You need to join a household to create shopping lists.
            </Text>
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.header}>
          Shopping Lists
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : lists && lists.length > 0 ? (
          <FlatList
            data={lists}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Surface style={styles.surface} elevation={1}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={64}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No Shopping Lists
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Create your first shopping list to get started
              </Text>
            </Surface>
          </View>
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setDialogVisible(true)}
        label="New List"
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Create Shopping List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List Name"
              value={listName}
              onChangeText={setListName}
              mode="outlined"
              autoFocus
              placeholder="e.g., Weekly Groceries"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleCreateList} 
              disabled={!listName.trim() || isCreating}
              loading={isCreating}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  header: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    opacity: 0.7,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surface: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
