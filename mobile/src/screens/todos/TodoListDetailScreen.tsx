import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Text,
  Card,
  FAB,
  useTheme,
  IconButton,
  Chip,
  Checkbox,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useGetTodoListQuery,
  useUpdateTodoItemMutation,
  useDeleteTodoItemMutation,
  TodoItem,
} from '../../store/services/todosApi';
import TodoItemModal from '../../components/todos/TodoItemModal';

export default function TodoListDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TodoItem | null>(null);

  const {
    data: todoList,
    isLoading,
    refetch,
  } = useGetTodoListQuery(id!);
  const [updateTodoItem] = useUpdateTodoItemMutation();
  const [deleteTodoItem] = useDeleteTodoItemMutation();

  const handleToggleComplete = async (item: TodoItem) => {
    try {
      await updateTodoItem({
        itemId: item.id,
        updates: { is_completed: !item.is_completed },
      }).unwrap();
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteTodoItem(itemId).unwrap();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleEditItem = (item: TodoItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'flag';
      case 'medium':
        return 'flag-outline';
      case 'low':
        return 'flag-variant-outline';
      default:
        return 'flag-variant-outline';
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderTodoItem = ({ item }: { item: TodoItem }) => {
    const dueDate = formatDueDate(item.due_date);
    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !item.is_completed;

    return (
      <Card style={styles.itemCard}>
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemLeft}>
            <Checkbox
              status={item.is_completed ? 'checked' : 'unchecked'}
              onPress={() => handleToggleComplete(item)}
            />
            <TouchableOpacity
              style={styles.itemTextContainer}
              onPress={() => handleEditItem(item)}
            >
              <Text
                variant="bodyLarge"
                style={[
                  styles.itemTitle,
                  item.is_completed && styles.completedText,
                ]}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.itemDescription,
                    item.is_completed && styles.completedText,
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
              <View style={styles.itemMeta}>
                <Chip
                  icon={getPriorityIcon(item.priority)}
                  compact
                  style={[
                    styles.priorityChip,
                    { backgroundColor: getPriorityColor(item.priority) + '20' },
                  ]}
                  textStyle={{ color: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </Chip>
                {dueDate && (
                  <Chip
                    icon="calendar"
                    compact
                    style={[
                      styles.dueDateChip,
                      isOverdue && styles.overdueChip,
                    ]}
                    textStyle={isOverdue ? { color: theme.colors.error } : undefined}
                  >
                    {dueDate}
                  </Chip>
                )}
                {item.assigned_user_id && (
                  <Chip icon="account" compact style={styles.assigneeChip}>
                    Assigned
                  </Chip>
                )}
              </View>
            </TouchableOpacity>
          </View>
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => handleDeleteItem(item.id)}
          />
        </Card.Content>
      </Card>
    );
  };

  const incompleteTasks = todoList?.items?.filter((item) => !item.is_completed) || [];
  const completedTasks = todoList?.items?.filter((item) => item.is_completed) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Surface style={styles.header} elevation={0}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {todoList?.name}
          </Text>
          <View style={styles.headerSpacer} />
        </Surface>

        <FlatList
          data={[...incompleteTasks, ...completedTasks]}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="checkbox-marked-circle-outline"
                size={80}
                color={theme.colors.outline}
                style={styles.emptyIcon}
              />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No Tasks Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Add your first task to get started
              </Text>
            </View>
          }
        />
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateItem}
        label="Add Task"
      />

      <TodoItemModal
        visible={modalVisible}
        onDismiss={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        listId={id!}
        item={editingItem}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 48,
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  itemTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  priorityChip: {
    marginRight: 4,
  },
  dueDateChip: {
    marginRight: 4,
  },
  overdueChip: {
    backgroundColor: '#ffebee',
  },
  assigneeChip: {
    marginRight: 4,
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
    marginTop: 64,
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
});
