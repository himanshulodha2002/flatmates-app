import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  FAB,
  Portal,
  Modal,
  Appbar,
  Text,
  Button,
  TextInput,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import {
  selectActiveShoppingListId,
  selectSelectedCategory,
  selectShowPurchased,
  selectPollingInterval,
  setActiveShoppingList,
} from '@/store/slices/shoppingSlice';
import {
  useGetShoppingListsQuery,
  useGetShoppingListQuery,
  useCreateShoppingListMutation,
  useCreateShoppingListItemMutation,
  useDeleteShoppingListMutation,
  useDeleteShoppingListItemMutation,
} from '@/store/services/shoppingApi';
import {
  ShoppingListCard,
  ShoppingItemList,
  AddItemForm,
  CategoryFilter,
} from '@/components/shopping';
import { ShoppingListCreateRequest, ShoppingListItemCreateRequest } from '@/types';
import { router } from 'expo-router';

type ViewMode = 'lists' | 'items';

export default function ShoppingScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const activeShoppingListId = useSelector(selectActiveShoppingListId);
  const selectedCategory = useSelector(selectSelectedCategory);
  const showPurchased = useSelector(selectShowPurchased);
  const pollingInterval = useSelector(selectPollingInterval);

  const [viewMode, setViewMode] = useState<ViewMode>('lists');
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Queries with polling for real-time updates
  const {
    data: shoppingLists = [],
    refetch: refetchLists,
  } = useGetShoppingListsQuery(
    {
      household_id: activeHouseholdId!,
      include_archived: false,
    },
    {
      skip: !activeHouseholdId,
      pollingInterval,
    }
  );

  const {
    data: currentList,
    refetch: refetchCurrentList,
  } = useGetShoppingListQuery(
    {
      list_id: activeShoppingListId!,
      category: selectedCategory || undefined,
      is_purchased: showPurchased ? undefined : false,
    },
    {
      skip: !activeShoppingListId,
      pollingInterval,
    }
  );

  // Mutations
  const [createList, { isLoading: isCreatingList }] = useCreateShoppingListMutation();
  const [createItem, { isLoading: isCreatingItem }] = useCreateShoppingListItemMutation();
  const [deleteList] = useDeleteShoppingListMutation();
  const [deleteItem] = useDeleteShoppingListItemMutation();

  // Auto-switch to items view when a list is selected
  useEffect(() => {
    if (activeShoppingListId) {
      setViewMode('items');
    } else {
      setViewMode('lists');
    }
  }, [activeShoppingListId]);

  // Redirect if no active household
  useEffect(() => {
    if (!activeHouseholdId) {
      router.replace('/');
    }
  }, [activeHouseholdId]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !activeHouseholdId) return;

    try {
      const listData: ShoppingListCreateRequest = {
        household_id: activeHouseholdId,
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
      };
      const newList = await createList(listData).unwrap();
      dispatch(setActiveShoppingList(newList.id));
      setShowCreateListModal(false);
      setNewListName('');
      setNewListDescription('');
    } catch (error) {
      console.error('Failed to create shopping list:', error);
    }
  };

  const handleAddItem = async (itemData: ShoppingListItemCreateRequest) => {
    if (!activeShoppingListId) return;

    try {
      await createItem({
        listId: activeShoppingListId,
        data: itemData,
      }).unwrap();
      setShowAddItemModal(false);
      refetchCurrentList();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList(listId).unwrap();
      if (activeShoppingListId === listId) {
        dispatch(setActiveShoppingList(null));
      }
      refetchLists();
    } catch (error) {
      console.error('Failed to delete shopping list:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeShoppingListId) return;

    try {
      await deleteItem({
        listId: activeShoppingListId,
        itemId,
      }).unwrap();
      refetchCurrentList();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleBackToLists = () => {
    dispatch(setActiveShoppingList(null));
    setViewMode('lists');
  };

  if (!activeHouseholdId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="bodyLarge">Please select a household first</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {viewMode === 'items' && currentList && (
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={handleBackToLists} />
          <Appbar.Content title={currentList.name} />
          <Appbar.Action icon="refresh" onPress={refetchCurrentList} />
        </Appbar.Header>
      )}

      {viewMode === 'items' && <CategoryFilter />}

      <ScrollView style={styles.content}>
        {viewMode === 'lists' ? (
          <>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Shopping Lists
              </Text>
            </View>

            {shoppingLists.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                  No shopping lists yet
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Create your first shopping list to get started
                </Text>
              </View>
            ) : (
              shoppingLists.map((list) => (
                <ShoppingListCard
                  key={list.id}
                  list={list}
                  onPress={() => dispatch(setActiveShoppingList(list.id))}
                  onDelete={() => handleDeleteList(list.id)}
                />
              ))
            )}
          </>
        ) : (
          currentList && (
            <ShoppingItemList
              items={currentList.items}
              listId={currentList.id}
              onDeleteItem={handleDeleteItem}
            />
          )
        )}
      </ScrollView>

      <FAB
        icon={viewMode === 'lists' ? 'plus' : 'cart-plus'}
        label={viewMode === 'lists' ? 'New List' : 'Add Item'}
        style={styles.fab}
        onPress={() =>
          viewMode === 'lists' ? setShowCreateListModal(true) : setShowAddItemModal(true)
        }
      />

      {/* Create Shopping List Modal */}
      <Portal>
        <Modal
          visible={showCreateListModal}
          onDismiss={() => setShowCreateListModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Create Shopping List
          </Text>

          <TextInput
            label="List Name *"
            value={newListName}
            onChangeText={setNewListName}
            mode="outlined"
            style={styles.input}
            autoFocus
          />

          <TextInput
            label="Description (optional)"
            value={newListDescription}
            onChangeText={setNewListDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCreateListModal(false)}
              style={styles.modalButton}
              disabled={isCreatingList}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateList}
              style={styles.modalButton}
              disabled={!newListName.trim() || isCreatingList}
              loading={isCreatingList}
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddItemModal}
          onDismiss={() => setShowAddItemModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <AddItemForm
            onSubmit={handleAddItem}
            onCancel={() => setShowAddItemModal(false)}
            loading={isCreatingItem}
          />
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
  },
});
