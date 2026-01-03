import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { useGetItemCategoriesQuery } from '@/store/services/shoppingApi';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import {
  selectSelectedCategory,
  selectShowPurchased,
  setSelectedCategory,
  setShowPurchased,
} from '@/store/slices/shoppingSlice';

export const CategoryFilter: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const selectedCategory = useSelector(selectSelectedCategory);
  const showPurchased = useSelector(selectShowPurchased);

  const { data: categories = [] } = useGetItemCategoriesQuery({
    household_id: activeHouseholdId || undefined,
  });

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      dispatch(setSelectedCategory(null));
    } else {
      dispatch(setSelectedCategory(category));
    }
  };

  const handleTogglePurchased = () => {
    dispatch(setShowPurchased(!showPurchased));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text
            variant="labelSmall"
            style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
          >
            FILTER
          </Text>
          <Chip
            mode={showPurchased ? 'outlined' : 'flat'}
            selected={!showPurchased}
            onPress={handleTogglePurchased}
            icon={showPurchased ? 'eye' : 'eye-off'}
            style={styles.chip}
          >
            {showPurchased ? 'All Items' : 'Pending Only'}
          </Chip>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text
              variant="labelSmall"
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              CATEGORY
            </Text>
            <Chip
              mode={!selectedCategory ? 'flat' : 'outlined'}
              selected={!selectedCategory}
              onPress={() => dispatch(setSelectedCategory(null))}
              style={styles.chip}
            >
              All
            </Chip>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                mode={selectedCategory === cat.name ? 'flat' : 'outlined'}
                selected={selectedCategory === cat.name}
                onPress={() => handleCategorySelect(cat.name)}
                style={styles.chip}
              >
                {cat.icon} {cat.name}
              </Chip>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    marginRight: 4,
  },
  chip: {
    marginRight: 0,
  },
});
