import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  useTheme,
  Chip,
} from 'react-native-paper';
import { ExpenseCategory, PaymentMethod, SplitType, ExpenseCreate } from '@/types';
import { useCreateExpenseMutation } from '@/store/services/expenseApi';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';

interface AddExpenseModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
}) => {
  const theme = useTheme();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [isPersonal, setIsPersonal] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: ExpenseCategory.GROCERIES, label: 'Groceries', icon: 'cart' },
    { value: ExpenseCategory.UTILITIES, label: 'Utilities', icon: 'flash' },
    { value: ExpenseCategory.RENT, label: 'Rent', icon: 'home' },
    { value: ExpenseCategory.INTERNET, label: 'Internet', icon: 'wifi' },
    { value: ExpenseCategory.CLEANING, label: 'Cleaning', icon: 'broom' },
    { value: ExpenseCategory.MAINTENANCE, label: 'Maintenance', icon: 'wrench' },
    { value: ExpenseCategory.ENTERTAINMENT, label: 'Entertainment', icon: 'gamepad-variant' },
    { value: ExpenseCategory.FOOD, label: 'Food', icon: 'food' },
    { value: ExpenseCategory.TRANSPORTATION, label: 'Transportation', icon: 'car' },
    { value: ExpenseCategory.OTHER, label: 'Other', icon: 'dots-horizontal' },
  ];

  const handleSubmit = async () => {
    setError('');

    if (!activeHouseholdId) {
      setError('Please select a household first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      const expenseData: ExpenseCreate = {
        household_id: activeHouseholdId,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        payment_method: paymentMethod,
        split_type: isPersonal ? SplitType.EQUAL : splitType,
        is_personal: isPersonal,
      };

      await createExpense(expenseData).unwrap();

      // Reset form
      setAmount('');
      setDescription('');
      setCategory(ExpenseCategory.OTHER);
      setPaymentMethod(PaymentMethod.CASH);
      setSplitType(SplitType.EQUAL);
      setIsPersonal(false);
      setError('');

      onSuccess?.();
      onDismiss();
    } catch (err: any) {
      setError(err.data?.detail || 'Failed to create expense');
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.title}>
            Add Expense
          </Text>

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            placeholder="What was this expense for?"
          />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Expense Type
          </Text>
          <SegmentedButtons
            value={isPersonal ? 'personal' : 'shared'}
            onValueChange={(value) => setIsPersonal(value === 'personal')}
            buttons={[
              { value: 'shared', label: 'Shared', icon: 'account-multiple' },
              { value: 'personal', label: 'Personal', icon: 'account' },
            ]}
            style={styles.segmentedButtons}
          />

          {!isPersonal && (
            <>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Split Type
              </Text>
              <SegmentedButtons
                value={splitType}
                onValueChange={(value) => setSplitType(value as SplitType)}
                buttons={[
                  { value: SplitType.EQUAL, label: 'Equal' },
                  { value: SplitType.CUSTOM, label: 'Custom' },
                ]}
                style={styles.segmentedButtons}
              />
            </>
          )}

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Chip
                key={cat.value}
                icon={cat.icon}
                selected={category === cat.value}
                onPress={() => setCategory(cat.value)}
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <Text variant="titleSmall" style={styles.sectionTitle}>
            Payment Method
          </Text>
          <SegmentedButtons
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            buttons={[
              { value: PaymentMethod.CASH, label: 'Cash' },
              { value: PaymentMethod.CARD, label: 'Card' },
              { value: PaymentMethod.BANK_TRANSFER, label: 'Bank' },
            ]}
            style={styles.segmentedButtons}
          />

          {error ? (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Add Expense
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  error: {
    color: '#f44336',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
});
