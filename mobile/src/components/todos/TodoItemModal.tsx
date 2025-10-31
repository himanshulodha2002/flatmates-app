import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  SegmentedButtons,
  useTheme,
  Text,
} from 'react-native-paper';
import {
  TodoItem,
  useCreateTodoItemMutation,
  useUpdateTodoItemMutation,
} from '../../store/services/todosApi';

interface TodoItemModalProps {
  visible: boolean;
  onDismiss: () => void;
  listId: string;
  item?: TodoItem | null;
}

export default function TodoItemModal({
  visible,
  onDismiss,
  listId,
  item,
}: TodoItemModalProps) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDateStr, setDueDateStr] = useState('');

  const [createTodoItem, { isLoading: isCreating }] = useCreateTodoItemMutation();
  const [updateTodoItem, { isLoading: isUpdating }] = useUpdateTodoItemMutation();

  const isEditing = !!item;
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setPriority(item.priority);
      setDueDateStr(item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDateStr('');
    }
  }, [item, visible]);

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      const dueDate = dueDateStr ? new Date(dueDateStr).toISOString() : undefined;

      if (isEditing) {
        await updateTodoItem({
          itemId: item.id,
          updates: {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            due_date: dueDate,
          },
        }).unwrap();
      } else {
        await createTodoItem({
          listId,
          item: {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            due_date: dueDate,
          },
        }).unwrap();
      }
      onDismiss();
    } catch (err) {
      console.error('Failed to save todo item:', err);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Task' : 'New Task'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            <TextInput
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              placeholder="e.g., Buy groceries"
              style={styles.input}
            />

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Add details about the task..."
              style={styles.input}
            />

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Priority
              </Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(value) => setPriority(value as any)}
                buttons={[
                  {
                    value: 'low',
                    label: 'Low',
                    icon: 'flag-variant-outline',
                  },
                  {
                    value: 'medium',
                    label: 'Medium',
                    icon: 'flag-outline',
                  },
                  {
                    value: 'high',
                    label: 'High',
                    icon: 'flag',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.label}>
                Due Date (Optional)
              </Text>
              <TextInput
                label="Due Date"
                value={dueDateStr}
                onChangeText={setDueDateStr}
                mode="outlined"
                placeholder="YYYY-MM-DD"
                style={styles.input}
                keyboardType="default"
              />
              {dueDateStr && (
                <Button
                  mode="text"
                  onPress={() => setDueDateStr('')}
                  compact
                  style={styles.clearButton}
                >
                  Clear Due Date
                </Button>
              )}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={handleSave}
            disabled={!title.trim() || isLoading}
            loading={isLoading}
          >
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
});
