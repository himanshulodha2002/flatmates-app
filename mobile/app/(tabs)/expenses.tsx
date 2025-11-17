import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  FAB,
  useTheme,
  Searchbar,
  Chip,
  Surface,
  ActivityIndicator,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  useListExpensesQuery,
  useGetHouseholdSummaryQuery,
  useGetPersonalAnalyticsQuery,
} from '@/store/services/expenseApi';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { Expense, ExpenseCategory } from '@/types';
import { router } from 'expo-router';

export default function ExpensesScreen() {
  const theme = useTheme();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const currentUser = useSelector(selectCurrentUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'shared' | 'personal' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Fetch expenses
  const {
    data: expenses = [],
    isLoading,
    refetch,
    isFetching,
  } = useListExpensesQuery(
    {
      household_id: activeHouseholdId || undefined,
      category: selectedCategory || undefined,
      is_personal: viewMode === 'all' ? undefined : viewMode === 'personal',
    },
    { skip: !activeHouseholdId }
  );

  // Fetch household summary
  const { data: summary } = useGetHouseholdSummaryQuery(activeHouseholdId!, {
    skip: !activeHouseholdId,
  });

  // Fetch personal analytics
  const { data: analytics } = useGetPersonalAnalyticsQuery(
    {
      user_id: currentUser?.id!,
      household_id: activeHouseholdId || undefined,
      months: 1,
    },
    { skip: !currentUser?.id || !activeHouseholdId }
  );

  const filteredExpenses = expenses.filter((expense: Expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: ExpenseCategory.GROCERIES, label: 'Groceries' },
    { value: ExpenseCategory.UTILITIES, label: 'Utilities' },
    { value: ExpenseCategory.RENT, label: 'Rent' },
    { value: ExpenseCategory.FOOD, label: 'Food' },
    { value: ExpenseCategory.ENTERTAINMENT, label: 'Entertainment' },
    { value: ExpenseCategory.OTHER, label: 'Other' },
  ];

  const handleExpensePress = (expense: Expense) => {
    router.push({
      pathname: '/expense-details',
      params: { expenseId: expense.id },
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="headlineMedium" style={styles.title}>
        Expenses
      </Text>

      {!activeHouseholdId ? (
        <Surface style={styles.noHouseholdCard} elevation={1}>
          <Text variant="titleMedium" style={styles.noHouseholdTitle}>
            No Household Selected
          </Text>
          <Text variant="bodyMedium" style={styles.noHouseholdText}>
            Please select or create a household to track expenses.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/create-household')}
            style={styles.createButton}
          >
            Create Household
          </Button>
        </Surface>
      ) : (
        <>
          {/* Summary Card */}
          {summary && (
            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Total Expenses
                  </Text>
                  <Text variant="headlineSmall" style={styles.summaryValue}>
                    ${summary.total_expenses.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Pending
                  </Text>
                  <Text variant="titleMedium" style={[styles.summaryValue, styles.pendingAmount]}>
                    ${summary.total_pending.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Settled
                  </Text>
                  <Text variant="titleMedium" style={[styles.summaryValue, styles.settledAmount]}>
                    ${summary.total_settled.toFixed(2)}
                  </Text>
                </View>
              </View>

              {currentUser && summary.user_balances && (
                <View style={styles.balanceSection}>
                  {summary.user_balances
                    .filter((balance) => balance.user_id === currentUser.id)
                    .map((balance) => (
                      <View key={balance.user_id} style={styles.userBalance}>
                        <Text variant="bodyMedium" style={styles.balanceLabel}>
                          Your Balance:
                        </Text>
                        <Text
                          variant="titleLarge"
                          style={[
                            styles.balanceAmount,
                            {
                              color:
                                balance.balance > 0
                                  ? '#4CAF50'
                                  : balance.balance < 0
                                    ? '#f44336'
                                    : theme.colors.onSurface,
                            },
                          ]}
                        >
                          {balance.balance > 0 ? '+' : ''}${balance.balance.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              <Button
                mode="outlined"
                onPress={() =>
                  router.push({
                    pathname: '/expense-analytics',
                    params: { householdId: activeHouseholdId },
                  })
                }
                style={styles.analyticsButton}
              >
                View Analytics
              </Button>
            </Surface>
          )}

          {/* Filters */}
          <View style={styles.filterSection}>
            <Searchbar
              placeholder="Search expenses..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            <SegmentedButtons
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'shared' | 'personal' | 'all')}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'shared', label: 'Shared' },
                { value: 'personal', label: 'Personal' },
              ]}
              style={styles.viewModeButtons}
            />

            <View style={styles.categoryFilters}>
              <Chip
                selected={selectedCategory === null}
                onPress={() => setSelectedCategory(null)}
                style={styles.categoryChip}
              >
                All
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat.value}
                  selected={selectedCategory === cat.value}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
                  }
                  style={styles.categoryChip}
                >
                  {cat.label}
                </Chip>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyText}>
        No expenses yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtext}>
        Add your first expense to get started!
      </Text>
    </View>
  );

  if (!activeHouseholdId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={() => handleExpensePress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
        label="Add Expense"
      />

      <AddExpenseModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onSuccess={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noHouseholdCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noHouseholdTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noHouseholdText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  pendingAmount: {
    color: '#FFC107',
  },
  settledAmount: {
    color: '#4CAF50',
  },
  balanceSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    marginBottom: 16,
  },
  userBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontWeight: '600',
  },
  balanceAmount: {
    fontWeight: 'bold',
  },
  analyticsButton: {
    marginTop: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
  },
  viewModeButtons: {
    marginBottom: 12,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
