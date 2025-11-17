import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Surface,
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  ActivityIndicator,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useGetExpenseStatsQuery,
  useCategorizWithAIMutation,
  useExtractReceiptDataMutation,
} from '../../src/store/services/expenseApi';
import * as ImagePicker from 'expo-image-picker';
import type { ExpenseCreateRequest } from '../../src/types';

export default function ExpensesScreen() {
  const theme = useTheme();
  const activeHouseholdId = useSelector((state: RootState) => state.household.activeHouseholdId);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // Queries
  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useGetExpensesQuery(
    { household_id: activeHouseholdId || undefined },
    { skip: !activeHouseholdId }
  );

  const { data: stats } = useGetExpenseStatsQuery(activeHouseholdId || '', {
    skip: !activeHouseholdId,
  });

  // Mutations
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [categorizeWithAI, { isLoading: isCategorizing }] = useCategorizWithAIMutation();
  const [extractReceipt, { isLoading: isExtracting }] = useExtractReceiptDataMutation();

  const handleGetAISuggestion = async () => {
    if (!title || !amount) {
      Alert.alert('Error', 'Please enter a title and amount first');
      return;
    }

    try {
      const result = await categorizeWithAI({
        description: `${title} - ${description}`,
        amount: parseFloat(amount),
      }).unwrap();

      setAiSuggestion(result);
      setCategory(result.category);
      Alert.alert(
        'AI Suggestion',
        `Category: ${result.category}\nConfidence: ${(result.confidence * 100).toFixed(0)}%\n\nReasoning: ${result.reasoning}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get AI categorization');
    }
  };

  const handleCreateExpense = async () => {
    if (!activeHouseholdId || !title || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const expenseData: ExpenseCreateRequest = {
        household_id: activeHouseholdId,
        title,
        description: description || undefined,
        amount: parseFloat(amount),
        category: category || undefined,
        expense_date: new Date().toISOString(),
        use_ai_categorization: useAI && !category,
      };

      await createExpense(expenseData).unwrap();
      Alert.alert('Success', 'Expense created successfully');
      resetForm();
      setCreateModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create expense');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload receipts');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processReceipt(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processReceipt(result.assets[0].uri);
    }
  };

  const processReceipt = async (uri: string) => {
    try {
      setReceiptModalVisible(true);

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      const result = await extractReceipt(formData).unwrap();

      if (result.success) {
        // Pre-fill form with OCR data
        setTitle(result.merchant || '');
        setAmount(result.total?.toString() || '');
        setReceiptModalVisible(false);
        setCreateModalVisible(true);

        if (result.items && result.items.length > 0) {
          const itemsDesc = result.items.map((item) => item.description).join(', ');
          setDescription(itemsDesc);
        }

        Alert.alert(
          'Receipt Scanned',
          `Successfully extracted data from receipt!\n\nMerchant: ${result.merchant}\nTotal: $${result.total}\nConfidence: ${((result.confidence || 0) * 100).toFixed(0)}%`
        );
      } else {
        setReceiptModalVisible(false);
        Alert.alert('Error', result.error || 'Failed to process receipt');
      }
    } catch (error) {
      setReceiptModalVisible(false);
      Alert.alert('Error', 'Failed to process receipt');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setCategory('');
    setAiSuggestion(null);
    setUseAI(true);
  };

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  if (!activeHouseholdId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="home-alert" size={64} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={styles.emptyText}>
            No Active Household
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Join or create a household to track expenses
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Stats Section */}
        {stats && (
          <Surface style={styles.statsContainer} elevation={1}>
            <Text variant="titleLarge" style={styles.statsTitle}>
              Expense Summary
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Expenses
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {stats.total_expenses}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Amount
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {formatCurrency(stats.total_amount)}
                </Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.statLabel}>
              This Month
            </Text>
            <Text variant="headlineMedium" style={styles.monthlyTotal}>
              {formatCurrency(stats.monthly_total)}
            </Text>
          </Surface>
        )}

        {/* AI Feature Banner */}
        <Card style={styles.aiBanner}>
          <Card.Content>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="robot" size={32} color={theme.colors.primary} />
              <View style={styles.aiTextContainer}>
                <Text variant="titleMedium" style={styles.aiTitle}>
                  AI-Powered Features
                </Text>
                <Text variant="bodySmall" style={styles.aiSubtitle}>
                  Smart categorization & receipt scanning
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Expenses List */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Expenses
        </Text>
        {expenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyCardText}>
                No expenses yet. Tap the + button to add your first expense.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text variant="titleMedium">{expense.title}</Text>
                    <View style={styles.categoryRow}>
                      <Chip icon="tag" compact>
                        {expense.category}
                      </Chip>
                      {expense.ai_categorized && (
                        <Chip icon="robot" compact style={styles.aiChip}>
                          AI
                        </Chip>
                      )}
                    </View>
                  </View>
                  <Text variant="headlineSmall" style={styles.expenseAmount}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
                {expense.description && (
                  <Text variant="bodySmall" style={styles.expenseDescription}>
                    {expense.description}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.expenseDate}>
                  {new Date(expense.expense_date).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Expense Modal */}
      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={() => {
            setCreateModalVisible(false);
            resetForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Add Expense
            </Text>

            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Amount *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Icon icon="currency-usd" />}
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Category (optional - AI will suggest)"
              value={category}
              onChangeText={setCategory}
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon="robot"
                  onPress={handleGetAISuggestion}
                  disabled={isCategorizing}
                />
              }
            />

            {aiSuggestion && (
              <Card style={styles.suggestionCard}>
                <Card.Content>
                  <Text variant="titleSmall">AI Suggestion</Text>
                  <Text variant="bodySmall">
                    Category: {aiSuggestion.category} (
                    {(aiSuggestion.confidence * 100).toFixed(0)}% confidence)
                  </Text>
                  <Text variant="bodySmall" style={styles.suggestionReason}>
                    {aiSuggestion.reasoning}
                  </Text>
                </Card.Content>
              </Card>
            )}

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateExpense}
                loading={isCreating}
                disabled={isCreating || !title || !amount}
                style={styles.button}
              >
                Create
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Receipt Processing Modal */}
        <Modal
          visible={receiptModalVisible}
          dismissable={false}
          contentContainerStyle={[styles.loadingModal, { backgroundColor: theme.colors.surface }]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.loadingText}>
            Processing Receipt...
          </Text>
          <Text variant="bodySmall" style={styles.loadingSubtext}>
            AI is extracting data from your receipt
          </Text>
        </Modal>
      </Portal>

      {/* FAB Menu */}
      <FAB.Group
        open={false}
        visible
        icon="plus"
        actions={[
          {
            icon: 'camera',
            label: 'Scan Receipt',
            onPress: handleTakePhoto,
          },
          {
            icon: 'image',
            label: 'Upload Receipt',
            onPress: handlePickImage,
          },
          {
            icon: 'pencil',
            label: 'Manual Entry',
            onPress: () => setCreateModalVisible(true),
          },
        ]}
        onStateChange={() => {}}
        onPress={() => setCreateModalVisible(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  monthlyTotal: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  aiBanner: {
    marginBottom: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  aiTitle: {
    fontWeight: 'bold',
  },
  aiSubtitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyCardText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  aiChip: {
    backgroundColor: '#4CAF50',
  },
  expenseAmount: {
    fontWeight: 'bold',
  },
  expenseDescription: {
    opacity: 0.7,
    marginTop: 4,
  },
  expenseDate: {
    opacity: 0.5,
    marginTop: 4,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  suggestionCard: {
    marginBottom: 12,
    backgroundColor: '#E3F2FD',
  },
  suggestionReason: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
  loadingModal: {
    margin: 20,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});
