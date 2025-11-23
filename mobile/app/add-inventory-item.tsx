import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  useTheme,
  SegmentedButtons,
  HelperText,
  Text,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import { useCreateInventoryItemMutation } from '@/store/services/inventoryApi';
import { InventoryCategory, InventoryLocation, InventoryItemCreateRequest } from '@/types';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddInventoryItemScreen() {
  const theme = useTheme();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<InventoryCategory>(InventoryCategory.OTHER);
  const [location, setLocation] = useState<InventoryLocation>(InventoryLocation.PANTRY);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [notes, setNotes] = useState('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showPurchasePicker, setShowPurchasePicker] = useState(false);

  const [createItem, { isLoading }] = useCreateInventoryItemMutation();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    if (!unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (lowStockThreshold && (isNaN(parseFloat(lowStockThreshold)) || parseFloat(lowStockThreshold) < 0)) {
      newErrors.lowStockThreshold = 'Threshold must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !activeHouseholdId) return;

    try {
      const itemData: InventoryItemCreateRequest = {
        household_id: activeHouseholdId,
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        category,
        location,
        expiry_date: expiryDate?.toISOString().split('T')[0],
        purchase_date: purchaseDate?.toISOString().split('T')[0],
        low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : undefined,
        notes: notes.trim() || undefined,
      };

      await createItem(itemData).unwrap();
      router.back();
    } catch (error) {
      console.error('Failed to create item:', error);
      setErrors({ submit: 'Failed to create item. Please try again.' });
    }
  };

  const categoryButtons = Object.values(InventoryCategory).map((cat) => ({
    value: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  }));

  const locationButtons = Object.values(InventoryLocation).map((loc) => ({
    value: loc,
    label: loc.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Inventory Item" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            label="Item Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            error={!!errors.name}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Quantity *"
                value={quantity}
                onChangeText={setQuantity}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.quantity}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.quantity}>
                {errors.quantity}
              </HelperText>
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Unit *"
                value={unit}
                onChangeText={setUnit}
                mode="outlined"
                placeholder="kg, liters, pieces"
                error={!!errors.unit}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.unit}>
                {errors.unit}
              </HelperText>
            </View>
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buttonScroll}>
            <View style={styles.buttonRow}>
              {categoryButtons.map((button) => (
                <Button
                  key={button.value}
                  mode={category === button.value ? 'contained' : 'outlined'}
                  onPress={() => setCategory(button.value as InventoryCategory)}
                  style={styles.segmentButton}
                >
                  {button.label}
                </Button>
              ))}
            </View>
          </ScrollView>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Location
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buttonScroll}>
            <View style={styles.buttonRow}>
              {locationButtons.map((button) => (
                <Button
                  key={button.value}
                  mode={location === button.value ? 'contained' : 'outlined'}
                  onPress={() => setLocation(button.value as InventoryLocation)}
                  style={styles.segmentButton}
                >
                  {button.label}
                </Button>
              ))}
            </View>
          </ScrollView>

          <Button
            mode="outlined"
            onPress={() => setShowExpiryPicker(true)}
            style={styles.dateButton}
          >
            {expiryDate ? `Expiry Date: ${expiryDate.toLocaleDateString()}` : 'Set Expiry Date (Optional)'}
          </Button>

          {showExpiryPicker && (
            <DateTimePicker
              value={expiryDate || new Date()}
              mode="date"
              onChange={(event, date) => {
                setShowExpiryPicker(Platform.OS === 'ios');
                if (date) setExpiryDate(date);
              }}
            />
          )}

          <Button
            mode="outlined"
            onPress={() => setShowPurchasePicker(true)}
            style={styles.dateButton}
          >
            {purchaseDate ? `Purchase Date: ${purchaseDate.toLocaleDateString()}` : 'Set Purchase Date (Optional)'}
          </Button>

          {showPurchasePicker && (
            <DateTimePicker
              value={purchaseDate || new Date()}
              mode="date"
              onChange={(event, date) => {
                setShowPurchasePicker(Platform.OS === 'ios');
                if (date) setPurchaseDate(date);
              }}
            />
          )}

          <TextInput
            label="Low Stock Threshold (Optional)"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            mode="outlined"
            keyboardType="numeric"
            placeholder="Alert when below this quantity"
            error={!!errors.lowStockThreshold}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.lowStockThreshold}>
            {errors.lowStockThreshold}
          </HelperText>

          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {errors.submit && (
            <HelperText type="error" visible={!!errors.submit}>
              {errors.submit}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          >
            Add Item
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonScroll: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    marginRight: 8,
  },
  dateButton: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
