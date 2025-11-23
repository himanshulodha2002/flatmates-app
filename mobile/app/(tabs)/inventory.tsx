import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  FAB,
  Portal,
  Modal,
  Text,
  Card,
  Chip,
  IconButton,
  useTheme,
  SegmentedButtons,
  Button,
  Searchbar,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import {
  useGetInventoryItemsQuery,
  useGetInventoryStatsQuery,
  useDeleteInventoryItemMutation,
  useConsumeInventoryItemMutation,
} from '@/store/services/inventoryApi';
import { InventoryLocation, InventoryCategory, InventoryItemWithDetails } from '@/types';
import { router } from 'expo-router';

type FilterType = 'all' | 'expiring_soon' | 'low_stock';

export default function InventoryScreen() {
  const theme = useTheme();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | undefined>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Build query params based on filters
  const queryParams = {
    household_id: activeHouseholdId!,
    location: selectedLocation,
    category: selectedCategory,
    expiring_soon: filterType === 'expiring_soon' ? true : undefined,
    low_stock: filterType === 'low_stock' ? true : undefined,
  };

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useGetInventoryItemsQuery(queryParams, {
    skip: !activeHouseholdId,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const { data: stats } = useGetInventoryStatsQuery(
    { household_id: activeHouseholdId! },
    { skip: !activeHouseholdId }
  );

  const [deleteItem] = useDeleteInventoryItemMutation();
  const [consumeItem] = useConsumeInventoryItemMutation();

  if (!activeHouseholdId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          No household selected
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Please create or join a household first
        </Text>
        <Button mode="contained" onPress={() => router.push('/create-household')} style={{ marginTop: 16 }}>
          Create Household
        </Button>
      </View>
    );
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId).unwrap();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleConsumeItem = async (itemId: string, quantity: number) => {
    try {
      await consumeItem({ itemId, data: { quantity } }).unwrap();
    } catch (error) {
      console.error('Failed to consume item:', error);
    }
  };

  const getCategoryIcon = (category: InventoryCategory): string => {
    const icons: Record<InventoryCategory, string> = {
      dairy: 'cheese',
      vegetables: 'carrot',
      fruits: 'food-apple',
      meat: 'food-steak',
      seafood: 'fish',
      grains: 'grain',
      pantry: 'food-variant',
      beverages: 'cup',
      frozen: 'snowflake',
      snacks: 'cookie',
      condiments: 'bottle-wine',
      other: 'dots-horizontal',
    };
    return icons[category] || 'food';
  };

  const getLocationIcon = (location: InventoryLocation): string => {
    const icons: Record<InventoryLocation, string> = {
      fridge: 'fridge',
      freezer: 'snowflake',
      pantry: 'cupboard',
      kitchen_cabinet: 'cupboard-outline',
      other: 'home',
    };
    return icons[location] || 'home';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getExpiryColor = (item: InventoryItemWithDetails): string => {
    if (!item.expiry_date) return theme.colors.surfaceVariant;
    if (item.days_until_expiry !== undefined) {
      if (item.days_until_expiry < 0) return theme.colors.error;
      if (item.days_until_expiry <= 3) return theme.colors.error;
      if (item.days_until_expiry <= 7) return theme.colors.tertiary;
    }
    return theme.colors.surfaceVariant;
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Stats Cards */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats.total_items}</Text>
              <Text variant="bodySmall">Total Items</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text variant="titleLarge">{stats.expiring_soon_count}</Text>
              <Text variant="bodySmall">Expiring Soon</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Card.Content>
              <Text variant="titleLarge">{stats.low_stock_count}</Text>
              <Text variant="bodySmall">Low Stock</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text variant="titleLarge">{stats.expired_count}</Text>
              <Text variant="bodySmall">Expired</Text>
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      {/* Search Bar */}
      <Searchbar
        placeholder="Search inventory..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Filter Buttons */}
      <SegmentedButtons
        value={filterType}
        onValueChange={(value) => setFilterType(value as FilterType)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'expiring_soon', label: 'Expiring' },
          { value: 'low_stock', label: 'Low Stock' },
        ]}
        style={styles.filterButtons}
      />

      {/* Location and Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        <Chip
          selected={!selectedLocation}
          onPress={() => setSelectedLocation(undefined)}
          style={styles.chip}
        >
          All Locations
        </Chip>
        {Object.values(InventoryLocation).map((location) => (
          <Chip
            key={location}
            selected={selectedLocation === location}
            onPress={() => setSelectedLocation(location)}
            icon={getLocationIcon(location)}
            style={styles.chip}
          >
            {location.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Chip>
        ))}
      </ScrollView>

      {/* Items List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No items found
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Add items to start tracking your inventory
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <Card.Content>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <IconButton
                      icon={getCategoryIcon(item.category)}
                      size={24}
                      iconColor={theme.colors.primary}
                    />
                    <View style={styles.itemTitleContent}>
                      <Text variant="titleMedium">{item.name}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <IconButton icon="delete" onPress={() => handleDeleteItem(item.id)} />
                </View>

                <View style={styles.itemDetails}>
                  <Chip icon={getLocationIcon(item.location)} style={styles.detailChip}>
                    {item.location.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Chip>
                  <Chip icon={getCategoryIcon(item.category)} style={styles.detailChip}>
                    {item.category.replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Chip>
                </View>

                {item.expiry_date && (
                  <Chip
                    icon="calendar"
                    style={[styles.expiryChip, { backgroundColor: getExpiryColor(item) }]}
                  >
                    Expires: {formatDate(item.expiry_date)}
                    {item.days_until_expiry !== undefined &&
                      ` (${item.days_until_expiry} days)`}
                  </Chip>
                )}

                {item.is_low_stock && (
                  <Chip icon="alert" style={[styles.warningChip, { backgroundColor: theme.colors.tertiaryContainer }]}>
                    Low Stock
                  </Chip>
                )}

                {item.notes && (
                  <Text variant="bodySmall" style={{ marginTop: 8, fontStyle: 'italic' }}>
                    {item.notes}
                  </Text>
                )}

                <View style={styles.itemActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleConsumeItem(item.id, 1)}
                    style={styles.actionButton}
                  >
                    Consume 1
                  </Button>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Added by {item.added_by_name}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB for adding items */}
      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/add-inventory-item')}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  statCard: {
    marginRight: 12,
    minWidth: 120,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitleContent: {
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  detailChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  expiryChip: {
    marginTop: 8,
  },
  warningChip: {
    marginTop: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButton: {
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
