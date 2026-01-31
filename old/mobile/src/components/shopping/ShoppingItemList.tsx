import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Checkbox, Text, IconButton, Chip, useTheme, Divider } from 'react-native-paper';
import { ShoppingListItemWithDetails } from '@/types';
import { useToggleItemPurchaseMutation } from '@/store/services/shoppingApi';

interface ShoppingItemListProps {
  items: ShoppingListItemWithDetails[];
  listId: string;
  onEditItem?: (item: ShoppingListItemWithDetails) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const ShoppingItemList: React.FC<ShoppingItemListProps> = ({
  items,
  listId,
  onEditItem,
  onDeleteItem,
}) => {
  const theme = useTheme();
  const [togglePurchase] = useToggleItemPurchaseMutation();

  const handleTogglePurchase = async (item: ShoppingListItemWithDetails) => {
    try {
      await togglePurchase({
        listId,
        itemId: item.id,
        data: { is_purchased: !item.is_purchased },
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle item purchase:', error);
    }
  };

  const renderItem = ({ item }: { item: ShoppingListItemWithDetails }) => {
    const categoryColor = getCategoryColor(item.category);

    return (
      <View>
        <List.Item
          title={
            <View style={styles.titleContainer}>
              <Text
                variant="bodyLarge"
                style={[styles.itemName, item.is_purchased && styles.purchasedText]}
              >
                {item.name}
              </Text>
              {item.category && (
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 10 }}
                  style={[styles.categoryChip, { backgroundColor: categoryColor }]}
                >
                  {item.category}
                </Chip>
              )}
              {item.is_recurring && (
                <Chip
                  mode="flat"
                  icon="repeat"
                  textStyle={{ fontSize: 10 }}
                  style={styles.recurringChip}
                >
                  {item.recurring_pattern}
                </Chip>
              )}
            </View>
          }
          description={
            <View style={styles.descriptionContainer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.quantity} {item.unit || 'items'}
                {item.price && ` • $${Number(item.price).toFixed(2)}`}
              </Text>
              {item.assigned_to_name && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  👤 {item.assigned_to_name}
                </Text>
              )}
              {item.notes && (
                <Text
                  variant="bodySmall"
                  style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {item.notes}
                </Text>
              )}
              {item.checked_off_by_name && (
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  ✓ Purchased by {item.checked_off_by_name}
                </Text>
              )}
            </View>
          }
          left={() => (
            <Checkbox
              status={item.is_purchased ? 'checked' : 'unchecked'}
              onPress={() => handleTogglePurchase(item)}
              color={theme.colors.primary}
            />
          )}
          right={() => (
            <View style={styles.actions}>
              {onEditItem && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => onEditItem(item)}
                  disabled={item.is_purchased}
                />
              )}
              {onDeleteItem && (
                <IconButton icon="delete" size={20} onPress={() => onDeleteItem(item.id)} />
              )}
            </View>
          )}
          style={[
            styles.listItem,
            item.is_purchased && { backgroundColor: theme.colors.surfaceVariant },
          ]}
        />
        <Divider />
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            No items in this list
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Add items to get started
          </Text>
        </View>
      }
    />
  );
};

// Helper function to get category color
const getCategoryColor = (category?: string): string => {
  const categoryColors: Record<string, string> = {
    Produce: '#4CAF50',
    Dairy: '#2196F3',
    'Meat & Seafood': '#F44336',
    Bakery: '#FF9800',
    Pantry: '#795548',
    Frozen: '#00BCD4',
    Snacks: '#FFC107',
    Beverages: '#9C27B0',
    'Health & Beauty': '#E91E63',
    Household: '#607D8B',
    Other: '#9E9E9E',
  };

  return categoryColors[category || 'Other'] || '#9E9E9E';
};

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
  },
  listItem: {
    paddingVertical: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  itemName: {
    fontWeight: '500',
  },
  purchasedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  categoryChip: {
    height: 20,
  },
  recurringChip: {
    height: 20,
  },
  descriptionContainer: {
    gap: 4,
  },
  notes: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
