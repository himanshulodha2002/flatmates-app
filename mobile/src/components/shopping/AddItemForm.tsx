import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Text,
  useTheme,
  Switch,
} from 'react-native-paper';
import { ShoppingListItemCreateRequest } from '@/types';
import { useGetItemCategoriesQuery } from '@/store/services/shoppingApi';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';

interface AddItemFormProps {
  onSubmit: (data: ShoppingListItemCreateRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const COMMON_UNITS = ['kg', 'g', 'L', 'mL', 'lbs', 'oz', 'pieces', 'dozen'];
const RECURRING_PATTERNS = ['weekly', 'biweekly', 'monthly'];

export const AddItemForm: React.FC<AddItemFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const theme = useTheme();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const { data: categories = [] } = useGetItemCategoriesQuery({
    household_id: activeHouseholdId || undefined,
  });

  const [formData, setFormData] = useState<ShoppingListItemCreateRequest>({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: undefined,
    price: undefined,
    notes: undefined,
    is_recurring: false,
    recurring_pattern: undefined,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text variant="headlineSmall" style={styles.title}>
        Add Item
      </Text>

      <TextInput
        label="Item Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.input}
        autoFocus
      />

      <View style={styles.row}>
        <TextInput
          label="Quantity"
          value={String(formData.quantity)}
          onChangeText={(text) => setFormData({ ...formData, quantity: Number(text) || 1 })}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.halfWidth]}
        />

        <TextInput
          label="Unit"
          value={formData.unit}
          onChangeText={(text) => setFormData({ ...formData, unit: text })}
          mode="outlined"
          style={[styles.input, styles.halfWidth]}
        />
      </View>

      <View style={styles.chipContainer}>
        {COMMON_UNITS.map((unit) => (
          <Chip
            key={unit}
            mode={formData.unit === unit ? 'flat' : 'outlined'}
            selected={formData.unit === unit}
            onPress={() => setFormData({ ...formData, unit })}
            style={styles.chip}
          >
            {unit}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge" style={styles.sectionLabel}>
        Category
      </Text>
      <View style={styles.chipContainer}>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            mode={formData.category === cat.name ? 'flat' : 'outlined'}
            selected={formData.category === cat.name}
            onPress={() =>
              setFormData({
                ...formData,
                category: formData.category === cat.name ? undefined : cat.name,
              })
            }
            style={styles.chip}
          >
            {cat.icon} {cat.name}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Price (optional)"
        value={formData.price ? String(formData.price) : ''}
        onChangeText={(text) =>
          setFormData({ ...formData, price: text ? Number(text) : undefined })
        }
        mode="outlined"
        keyboardType="decimal-pad"
        left={<TextInput.Icon icon="currency-usd" />}
        style={styles.input}
      />

      <TextInput
        label="Notes (optional)"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text || undefined })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Recurring Item</Text>
          <Switch
            value={formData.is_recurring}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                is_recurring: value,
                recurring_pattern: value ? 'weekly' : undefined,
              })
            }
          />
        </View>
        {formData.is_recurring && (
          <SegmentedButtons
            value={formData.recurring_pattern || 'weekly'}
            onValueChange={(value) =>
              setFormData({ ...formData, recurring_pattern: value })
            }
            buttons={RECURRING_PATTERNS.map((pattern) => ({
              value: pattern,
              label: pattern.charAt(0).toUpperCase() + pattern.slice(1),
            }))}
            style={styles.segmentedButtons}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={[styles.button, styles.halfWidth]}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.button, styles.halfWidth]}
          disabled={!formData.name.trim() || loading}
          loading={loading}
        >
          Add Item
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 0,
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
