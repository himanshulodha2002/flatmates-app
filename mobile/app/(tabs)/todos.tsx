import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  FAB,
  Card,
  Text,
  ActivityIndicator,
  Chip,
  IconButton,
  Menu,
  Snackbar,
  Portal,
  Dialog,
  TextInput,
  Button,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoStatusMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useGetTodoStatsQuery,
} from '@/store/services/todoApi';
import { useGetHouseholdDetailsQuery } from '@/store/services/householdApi';
import { useGetTaskSuggestionsMutation } from '@/store/services/expenseApi';
import { Todo, TodoStatus, TodoPriority, TodoCreateRequest, TodoUpdateRequest, TaskSuggestion } from '@/types';

export default function TodosScreen() {
  const router = useRouter();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const currentUser = useSelector(selectCurrentUser);

  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [suggestionsDialogVisible, setSuggestionsDialogVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TaskSuggestion[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);

  const { data: household } = useGetHouseholdDetailsQuery(activeHouseholdId || '', {
    skip: !activeHouseholdId,
  });

  const { data: todos, isLoading } = useGetTodosQuery(
    {
      household_id: activeHouseholdId || '',
      status: statusFilter !== 'all' ? statusFilter : undefined,
      assigned_to_me: assignedToMeFilter,
      include_completed: true,
    },
    { skip: !activeHouseholdId }
  );

  const { data: stats } = useGetTodoStatsQuery(activeHouseholdId || '', {
    skip: !activeHouseholdId,
  });

  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodoStatus] = useUpdateTodoStatusMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [getTaskSuggestions, { isLoading: isLoadingSuggestions }] = useGetTaskSuggestionsMutation();

  const handleCreateTodo = async () => {
    if (!title.trim() || !activeHouseholdId) return;

    try {
      const todoData: TodoCreateRequest = {
        household_id: activeHouseholdId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to_id: assignedToId,
      };

      await createTodo(todoData).unwrap();
      setDialogVisible(false);
      resetForm();
      setSnackbarMessage('Todo created successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to create todo');
      setSnackbarVisible(true);
    }
  };

  const handleUpdateTodo = async () => {
    if (!title.trim() || !editingTodo) return;

    try {
      const todoData: TodoUpdateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to_id: assignedToId,
      };

      await updateTodo({ todoId: editingTodo.id, data: todoData }).unwrap();
      setDialogVisible(false);
      resetForm();
      setSnackbarMessage('Todo updated successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to update todo');
      setSnackbarVisible(true);
    }
  };

  const handleStatusChange = async (todoId: string, newStatus: TodoStatus) => {
    try {
      await updateTodoStatus({ todoId, data: { status: newStatus } }).unwrap();
      setSnackbarMessage('Todo status updated');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to update status');
      setSnackbarVisible(true);
    }
    setMenuVisible(null);
  };

  const handleDeleteTodo = async (todoId: string, todoTitle: string) => {
    Alert.alert('Delete Todo', `Are you sure you want to delete "${todoTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodo(todoId).unwrap();
            setSnackbarMessage('Todo deleted');
            setSnackbarVisible(true);
          } catch (error: any) {
            setSnackbarMessage(error?.data?.detail || 'Failed to delete todo');
            setSnackbarVisible(true);
          }
        },
      },
    ]);
    setMenuVisible(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingTodo(null);
    setDialogVisible(true);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setPriority(todo.priority);
    setAssignedToId(todo.assigned_to_id);
    setDialogVisible(true);
    setMenuVisible(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(TodoPriority.MEDIUM);
    setAssignedToId(undefined);
    setEditingTodo(null);
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.HIGH:
        return '#CF6679';
      case TodoPriority.MEDIUM:
        return '#03DAC6';
      case TodoPriority.LOW:
        return '#938F99';
    }
  };

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.COMPLETED:
        return '#4CAF50';
      case TodoStatus.IN_PROGRESS:
        return '#03DAC6';
      case TodoStatus.PENDING:
        return '#938F99';
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.COMPLETED:
        return 'check-circle';
      case TodoStatus.IN_PROGRESS:
        return 'progress-clock';
      case TodoStatus.PENDING:
        return 'circle-outline';
    }
  };

  const getMemberName = (userId: string) => {
    const member = household?.members.find((m) => m.user_id === userId);
    return member?.full_name || 'Unknown';
  };

  const handleGetAISuggestions = async () => {
    if (!activeHouseholdId) return;

    try {
      const result = await getTaskSuggestions(activeHouseholdId).unwrap();
      setAiSuggestions(result.suggestions);
      setSuggestionsDialogVisible(true);
    } catch (error: any) {
      setSnackbarMessage('Failed to get AI suggestions');
      setSnackbarVisible(true);
    }
  };

  const handleCreateFromSuggestion = async (suggestion: TaskSuggestion) => {
    if (!activeHouseholdId) return;

    try {
      const todoData: TodoCreateRequest = {
        household_id: activeHouseholdId,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority as TodoPriority,
      };

      await createTodo(todoData).unwrap();
      setSnackbarMessage('Todo created from AI suggestion');
      setSnackbarVisible(true);

      // Remove the suggestion from the list
      setAiSuggestions(aiSuggestions.filter((s) => s.title !== suggestion.title));
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to create todo');
      setSnackbarVisible(true);
    }
  };

  if (!activeHouseholdId) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No household selected
        </Text>
        <Button mode="contained" onPress={() => router.push('/household-switcher')}>
          Select Household
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.statLabel}>
                Pending
              </Text>
              <Text variant="headlineMedium" style={styles.statValue}>
                {stats.pending}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.statLabel}>
                In Progress
              </Text>
              <Text variant="headlineMedium" style={[styles.statValue, { color: '#03DAC6' }]}>
                {stats.in_progress}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.statLabel}>
                Completed
              </Text>
              <Text variant="headlineMedium" style={[styles.statValue, { color: '#4CAF50' }]}>
                {stats.completed}
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={statusFilter === TodoStatus.PENDING}
            onPress={() => setStatusFilter(TodoStatus.PENDING)}
            style={styles.chip}
          >
            Pending
          </Chip>
          <Chip
            selected={statusFilter === TodoStatus.IN_PROGRESS}
            onPress={() => setStatusFilter(TodoStatus.IN_PROGRESS)}
            style={styles.chip}
          >
            In Progress
          </Chip>
          <Chip
            selected={statusFilter === TodoStatus.COMPLETED}
            onPress={() => setStatusFilter(TodoStatus.COMPLETED)}
            style={styles.chip}
          >
            Completed
          </Chip>
          <Chip
            selected={assignedToMeFilter}
            onPress={() => setAssignedToMeFilter(!assignedToMeFilter)}
            style={styles.chip}
            icon="account"
          >
            Assigned to Me
          </Chip>
          <Chip
            onPress={handleGetAISuggestions}
            style={[styles.chip, styles.aiChip]}
            icon="robot"
          >
            AI Suggestions
          </Chip>
        </ScrollView>
      </View>

      {/* Todo List */}
      <ScrollView style={styles.list}>
        {todos?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No todos found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Create your first todo to get started
            </Text>
          </View>
        ) : (
          todos?.map((todo) => (
            <Card key={todo.id} style={styles.todoCard}>
              <Card.Content>
                <View style={styles.todoHeader}>
                  <View style={styles.todoTitleRow}>
                    <IconButton
                      icon={getStatusIcon(todo.status)}
                      size={24}
                      iconColor={getStatusColor(todo.status)}
                      onPress={() => {
                        const nextStatus =
                          todo.status === TodoStatus.PENDING
                            ? TodoStatus.IN_PROGRESS
                            : todo.status === TodoStatus.IN_PROGRESS
                            ? TodoStatus.COMPLETED
                            : TodoStatus.PENDING;
                        handleStatusChange(todo.id, nextStatus);
                      }}
                    />
                    <View style={styles.todoTextContainer}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.todoTitle,
                          todo.status === TodoStatus.COMPLETED && styles.completedText,
                        ]}
                      >
                        {todo.title}
                      </Text>
                      {todo.description && (
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.todoDescription,
                            todo.status === TodoStatus.COMPLETED && styles.completedText,
                          ]}
                        >
                          {todo.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Menu
                    visible={menuVisible === todo.id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(todo.id)} />}
                  >
                    <Menu.Item onPress={() => openEditDialog(todo)} title="Edit" leadingIcon="pencil" />
                    <Menu.Item
                      onPress={() => handleStatusChange(todo.id, TodoStatus.PENDING)}
                      title="Mark Pending"
                      leadingIcon="circle-outline"
                    />
                    <Menu.Item
                      onPress={() => handleStatusChange(todo.id, TodoStatus.IN_PROGRESS)}
                      title="Mark In Progress"
                      leadingIcon="progress-clock"
                    />
                    <Menu.Item
                      onPress={() => handleStatusChange(todo.id, TodoStatus.COMPLETED)}
                      title="Mark Completed"
                      leadingIcon="check-circle"
                    />
                    <Divider />
                    <Menu.Item
                      onPress={() => handleDeleteTodo(todo.id, todo.title)}
                      title="Delete"
                      leadingIcon="delete"
                    />
                  </Menu>
                </View>

                <View style={styles.todoMeta}>
                  <Chip
                    style={[styles.priorityChip, { backgroundColor: getPriorityColor(todo.priority) }]}
                    textStyle={styles.priorityText}
                  >
                    {todo.priority.toUpperCase()}
                  </Chip>
                  {todo.assigned_to_id && (
                    <Chip style={styles.assigneeChip} icon="account">
                      {getMemberName(todo.assigned_to_id)}
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Todo FAB */}
      <FAB style={styles.fab} icon="plus" onPress={openCreateDialog} />

      {/* AI Suggestions Dialog */}
      <Portal>
        <Dialog
          visible={suggestionsDialogVisible}
          onDismiss={() => setSuggestionsDialogVisible(false)}
          style={styles.suggestionsDialog}
        >
          <Dialog.Title>AI Task Suggestions</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {isLoadingSuggestions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    AI is analyzing your household...
                  </Text>
                </View>
              ) : aiSuggestions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No suggestions available
                  </Text>
                </View>
              ) : (
                aiSuggestions.map((suggestion, index) => (
                  <Card key={index} style={styles.suggestionCard}>
                    <Card.Content>
                      <View style={styles.suggestionHeader}>
                        <Chip
                          style={[
                            styles.priorityChip,
                            { backgroundColor: getPriorityColor(suggestion.priority as TodoPriority) },
                          ]}
                          textStyle={styles.priorityText}
                        >
                          {suggestion.priority.toUpperCase()}
                        </Chip>
                        <Chip compact icon="tag">
                          {suggestion.category}
                        </Chip>
                      </View>
                      <Text variant="titleMedium" style={styles.suggestionTitle}>
                        {suggestion.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.suggestionDescription}>
                        {suggestion.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.suggestionReasoning}>
                        AI Reasoning: {suggestion.reasoning}
                      </Text>
                      <Button
                        mode="contained"
                        onPress={() => handleCreateFromSuggestion(suggestion)}
                        style={styles.createButton}
                        icon="plus"
                      >
                        Create Task
                      </Button>
                    </Card.Content>
                  </Card>
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSuggestionsDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Create/Edit Todo Dialog */}
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingTodo ? 'Edit Todo' : 'Create Todo'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <Text variant="labelMedium" style={styles.label}>
                Priority
              </Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(value) => setPriority(value as TodoPriority)}
                buttons={[
                  { value: TodoPriority.LOW, label: 'Low' },
                  { value: TodoPriority.MEDIUM, label: 'Medium' },
                  { value: TodoPriority.HIGH, label: 'High' },
                ]}
                style={styles.input}
              />
              <Text variant="labelMedium" style={styles.label}>
                Assign To
              </Text>
              <SegmentedButtons
                value={assignedToId || 'none'}
                onValueChange={(value) => setAssignedToId(value === 'none' ? undefined : value)}
                buttons={[
                  { value: 'none', label: 'Unassigned' },
                  ...(household?.members.slice(0, 3).map((m) => ({
                    value: m.user_id,
                    label: m.full_name.split(' ')[0],
                  })) || []),
                ]}
                style={styles.input}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={editingTodo ? handleUpdateTodo : handleCreateTodo}
              loading={isCreating}
              disabled={isCreating || !title.trim()}
            >
              {editingTodo ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
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
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  aiChip: {
    backgroundColor: '#4CAF50',
  },
  list: {
    flex: 1,
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#b0b0b0',
    textAlign: 'center',
  },
  todoCard: {
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  todoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  todoTitle: {
    fontWeight: '600',
  },
  todoDescription: {
    marginTop: 4,
    opacity: 0.8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  todoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  assigneeChip: {
    height: 28,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#BB86FC',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    opacity: 0.7,
  },
  suggestionsDialog: {
    maxHeight: '80%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  suggestionCard: {
    marginBottom: 12,
    backgroundColor: '#2C2C2C',
  },
  suggestionHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionDescription: {
    marginBottom: 8,
    opacity: 0.9,
  },
  suggestionReasoning: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 12,
  },
  createButton: {
    marginTop: 8,
  },
});
