import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  FAB,
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  ActivityIndicator,
  Chip,
  IconButton,
  Menu,
  Divider,
  Checkbox,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useGetShoppingListQuery,
  useAddItemToListMutation,
  useUpdateShoppingItemMutation,
  useDeleteShoppingItemMutation,
} from '@/store/services/shoppingApi';
import type { ShoppingItem } from '@/types';

const CATEGORIES = [
  'Dairy',
  'Meat',
  'Vegetables',
  'Fruits',
  'Bakery',
  'Beverages',
  'Snacks',
  'Household',
  'Other',
];

export default function ShoppingListDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'purchased' | 'unpurchased'>('all');
  
  const { data: shoppingList, isLoading, error } = useGetShoppingListQuery(id!);
  const [addItem, { isLoading: isAdding }] = useAddItemToListMutation();
  const [updateItem] = useUpdateShoppingItemMutation();
  const [deleteItem] = useDeleteShoppingItemMutation();

  const handleAddItem = async () => {
    if (itemName.trim() && id) {
      try {
        await addItem({
          listId: id,
          item: {
            name: itemName.trim(),
            quantity: itemQuantity.trim() || undefined,
            category: itemCategory || undefined,
          },
        }).unwrap();
        setItemName('');
        setItemQuantity('');
        setItemCategory('');
        setDialogVisible(false);
      } catch (err) {
        console.error('Failed to add item:', err);
      }
    }
  };

  const handleTogglePurchased = async (item: ShoppingItem) => {
    try {
      await updateItem({
        itemId: item.id,
        updates: { is_purchased: !item.is_purchased },
      }).unwrap();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId).unwrap();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setItemName('');
    setItemQuantity('');
    setItemCategory('');
    setDialogVisible(true);
  };

  const filteredItems = shoppingList?.items.filter((item) => {
    if (filter === 'purchased') return item.is_purchased;
    if (filter === 'unpurchased') return !item.is_purchased;
    return true;
  }) || [];

  const purchasedCount = shoppingList?.items.filter(i => i.is_purchased).length || 0;
  const totalCount = shoppingList?.items.length || 0;

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemRow}>
          <Checkbox
            status={item.is_purchased ? 'checked' : 'unchecked'}
            onPress={() => handleTogglePurchased(item)}
          />
          <View style={styles.itemContent}>
            <Text
              variant="bodyLarge"
              style={[
                styles.itemName,
                item.is_purchased && styles.itemNamePurchased,
              ]}
            >
              {item.name}
            </Text>
            <View style={styles.itemMeta}>
              {item.quantity && (
                <Text variant="bodySmall" style={styles.itemQuantity}>
                  {item.quantity}
                </Text>
              )}
              {item.category && (
                <Chip
                  mode="outlined"
                  compact
                  style={styles.categoryChip}
                  textStyle={styles.categoryChipText}
                >
                  {item.category}
                </Chip>
              )}
            </View>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteItem(item.id)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shoppingList) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="titleLarge" style={styles.errorText}>
            Failed to load shopping list
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineSmall" style={styles.title}>
          {shoppingList.name}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.stats}>
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{totalCount}</Text>
              <Text variant="bodySmall">Total Items</Text>
            </View>
            <Divider style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {purchasedCount}
              </Text>
              <Text variant="bodySmall">Purchased</Text>
            </View>
            <Divider style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="headlineMedium">{totalCount - purchasedCount}</Text>
              <Text variant="bodySmall">Remaining</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.filterContainer}>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={filter === 'unpurchased'}
          onPress={() => setFilter('unpurchased')}
          style={styles.filterChip}
        >
          To Buy
        </Chip>
        <Chip
          selected={filter === 'purchased'}
          onPress={() => setFilter('purchased')}
          style={styles.filterChip}
        >
          Purchased
        </Chip>
      </View>

      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cart-off"
            size={64}
            color={theme.colors.outline}
          />
          <Text variant="titleMedium" style={styles.emptyText}>
            {filter === 'all' ? 'No items yet' : `No ${filter} items`}
          </Text>
        </View>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        label="Add Item"
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Add Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Item Name *"
              value={itemName}
              onChangeText={setItemName}
              mode="outlined"
              autoFocus
              style={styles.input}
            />
            <TextInput
              label="Quantity"
              value={itemQuantity}
              onChangeText={setItemQuantity}
              mode="outlined"
              placeholder="e.g., 2 kg, 1 dozen"
              style={styles.input}
            />
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                  style={styles.input}
                  contentStyle={styles.categoryButton}
                >
                  {itemCategory || 'Select Category (Optional)'}
                </Button>
              }
            >
              {CATEGORIES.map((category) => (
                <Menu.Item
                  key={category}
                  onPress={() => {
                    setItemCategory(category);
                    setCategoryMenuVisible(false);
                  }}
                  title={category}
                />
              ))}
              {itemCategory && (
                <>
                  <Divider />
                  <Menu.Item
                    onPress={() => {
                      setItemCategory('');
                      setCategoryMenuVisible(false);
                    }}
                    title="Clear Category"
                    leadingIcon="close"
                  />
                </>
              )}
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddItem}
              disabled={!itemName.trim() || isAdding}
              loading={isAdding}
            >
              Add
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  stats: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemCard: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontWeight: '500',
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  itemQuantity: {
    opacity: 0.7,
  },
  categoryChip: {
    height: 24,
  },
  categoryChipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
  categoryButton: {
    justifyContent: 'flex-start',
  },
});
