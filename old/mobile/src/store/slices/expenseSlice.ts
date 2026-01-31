import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ExpenseState,
  Expense,
  ExpenseWithSplits,
  ExpenseSummary,
  PersonalExpenseAnalytics,
} from '@/types';

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  summary: null,
  analytics: null,
  loading: false,
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
    },
    setCurrentExpense: (state, action: PayloadAction<ExpenseWithSplits | null>) => {
      state.currentExpense = action.payload;
    },
    setSummary: (state, action: PayloadAction<ExpenseSummary | null>) => {
      state.summary = action.payload;
    },
    setAnalytics: (state, action: PayloadAction<PersonalExpenseAnalytics | null>) => {
      state.analytics = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearExpenseData: (state) => {
      state.expenses = [];
      state.currentExpense = null;
      state.summary = null;
      state.analytics = null;
      state.loading = false;
    },
  },
});

export const {
  setExpenses,
  addExpense,
  updateExpense,
  removeExpense,
  setCurrentExpense,
  setSummary,
  setAnalytics,
  setLoading,
  clearExpenseData,
} = expenseSlice.actions;

// Selectors
export const selectExpenses = (state: { expense: ExpenseState }) => state.expense.expenses;
export const selectCurrentExpense = (state: { expense: ExpenseState }) =>
  state.expense.currentExpense;
export const selectExpenseSummary = (state: { expense: ExpenseState }) => state.expense.summary;
export const selectExpenseAnalytics = (state: { expense: ExpenseState }) => state.expense.analytics;
export const selectExpenseLoading = (state: { expense: ExpenseState }) => state.expense.loading;

export default expenseSlice.reducer;
