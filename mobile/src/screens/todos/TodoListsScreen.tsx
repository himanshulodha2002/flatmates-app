import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
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
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useGetTodoListsQuery,
  useCreateTodoListMutation,
} from '../../store/services/todosApi';

export default function TodoListsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newListName, setNewListName] = useState('');

  const {
    data: todoLists = [],
    isLoading,
    refetch,
    error,
  } = useGetTodoListsQuery();
  const [createTodoList, { isLoading: isCreating }] = useCreateTodoListMutation();

  const handleCreateList = async () => {
    if (newListName.trim()) {
      try {
        await createTodoList({ name: newListName.trim() }).unwrap();
        setNewListName('');
        setCreateDialogVisible(false);
      } catch (err) {
        console.error('Failed to create todo list:', err);
      }
    }
  };

  const renderListItem = ({ item }: { item: any }) => {
    const completedCount = item.items?.filter((i: any) => i.is_completed).length || 0;
    const totalCount = item.items?.length || 0;
    const openCount = totalCount - completedCount;

    return (
      <Card
        style={styles.listCard}
        onPress={() => router.push(`/todos/${item.id}` as any)}
      >
        <Card.Content>
          <View style={styles.listHeader}>
            <MaterialCommunityIcons
              name="format-list-checkbox"
              size={24}
              color={theme.colors.primary}
              style={styles.listIcon}
            />
            <Text variant="titleMedium" style={styles.listTitle}>
              {item.name}
            </Text>
          </View>
          <View style={styles.listStats}>
            <Chip icon="check-circle-outline" compact>
              {completedCount} completed
            </Chip>
            <Chip icon="circle-outline" compact style={styles.chipSpacing}>
              {openCount} open
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (error) {
    const errorMessage = (error as any)?.data?.detail || 'Failed to load todo lists';
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Surface style={styles.errorSurface} elevation={1}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color={theme.colors.error}
              style={styles.icon}
            />
            <Text variant="titleLarge" style={styles.errorTitle}>
              {errorMessage.includes('household') ? 'No Household' : 'Error'}
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              {errorMessage}
            </Text>
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Todo Lists
          </Text>
        </Surface>

        {!isLoading && todoLists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="format-list-checkbox"
              size={80}
              color={theme.colors.outline}
              style={styles.emptyIcon}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Todo Lists Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Create your first todo list to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={todoLists}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setCreateDialogVisible(true)}
        label="New List"
      />

      <Portal>
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>Create Todo List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List Name"
              value={newListName}
              onChangeText={setNewListName}
              mode="outlined"
              autoFocus
              placeholder="e.g., Weekly Tasks, Shopping"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleCreateList}
              disabled={!newListName.trim() || isCreating}
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
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  listCard: {
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listIcon: {
    marginRight: 8,
  },
  listTitle: {
    flex: 1,
    fontWeight: '600',
  },
  listStats: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSpacing: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  errorSurface: {
    padding: 32,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
