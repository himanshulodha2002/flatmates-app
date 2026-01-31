import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { Expense, ExpenseCategory } from '@/types';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
}

const categoryIcons: Record<ExpenseCategory, string> = {
  [ExpenseCategory.GROCERIES]: 'cart',
  [ExpenseCategory.UTILITIES]: 'flash',
  [ExpenseCategory.RENT]: 'home',
  [ExpenseCategory.INTERNET]: 'wifi',
  [ExpenseCategory.CLEANING]: 'broom',
  [ExpenseCategory.MAINTENANCE]: 'wrench',
  [ExpenseCategory.ENTERTAINMENT]: 'gamepad-variant',
  [ExpenseCategory.FOOD]: 'food',
  [ExpenseCategory.TRANSPORTATION]: 'car',
  [ExpenseCategory.OTHER]: 'dots-horizontal',
};

const categoryColors: Record<ExpenseCategory, string> = {
  [ExpenseCategory.GROCERIES]: '#4CAF50',
  [ExpenseCategory.UTILITIES]: '#FFC107',
  [ExpenseCategory.RENT]: '#F44336',
  [ExpenseCategory.INTERNET]: '#2196F3',
  [ExpenseCategory.CLEANING]: '#9C27B0',
  [ExpenseCategory.MAINTENANCE]: '#FF9800',
  [ExpenseCategory.ENTERTAINMENT]: '#E91E63',
  [ExpenseCategory.FOOD]: '#FF5722',
  [ExpenseCategory.TRANSPORTATION]: '#00BCD4',
  [ExpenseCategory.OTHER]: '#9E9E9E',
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress }) => {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.description}>
              {expense.description}
            </Text>
            {expense.is_personal && (
              <Chip
                icon="account"
                style={[styles.personalChip, { backgroundColor: theme.colors.secondary }]}
                textStyle={styles.chipText}
                compact
              >
                Personal
              </Chip>
            )}
          </View>
          <Text variant="headlineSmall" style={styles.amount}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>

        <View style={styles.details}>
          <Chip
            icon={categoryIcons[expense.category]}
            style={[styles.categoryChip, { backgroundColor: categoryColors[expense.category] }]}
            textStyle={styles.chipText}
            compact
          >
            {getCategoryLabel(expense.category)}
          </Chip>

          <View style={styles.metadata}>
            <Text variant="bodySmall" style={styles.metadataText}>
              {formatDate(expense.date)}
            </Text>
            {expense.creator_name && (
              <Text variant="bodySmall" style={styles.metadataText}>
                by {expense.creator_name}
              </Text>
            )}
          </View>
        </View>

        {!expense.is_personal && (
          <View style={styles.splitInfo}>
            <Text variant="bodySmall" style={styles.splitText}>
              Split: {expense.split_type}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amount: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  personalChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  metadata: {
    alignItems: 'flex-end',
  },
  metadataText: {
    opacity: 0.7,
    marginTop: 2,
  },
  splitInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  splitText: {
    opacity: 0.7,
    textTransform: 'capitalize',
  },
});
