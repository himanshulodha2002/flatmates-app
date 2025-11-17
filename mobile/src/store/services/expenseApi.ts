import { api } from './api';
import type {
  Expense,
  ExpenseWithDetails,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpenseStats,
  AICategorizeRequest,
  AICategorizeResponse,
  ReceiptOCRResponse,
  TaskSuggestionsResponse,
} from '../../types';

export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all expenses with optional filters
    getExpenses: builder.query<
      Expense[],
      {
        household_id?: string;
        category?: string;
        paid_by_id?: string;
        start_date?: string;
        end_date?: string;
      }
    >({
      query: (params) => ({
        url: '/expenses',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),

    // Get a single expense by ID
    getExpense: builder.query<ExpenseWithDetails, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),

    // Create a new expense
    createExpense: builder.mutation<Expense, ExpenseCreateRequest>({
      query: (expense) => ({
        url: '/expenses',
        method: 'POST',
        body: expense,
      }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),

    // Update an expense
    updateExpense: builder.mutation<Expense, { id: string; data: ExpenseUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
      ],
    }),

    // Delete an expense
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Expense', id },
        { type: 'Expense', id: 'LIST' },
      ],
    }),

    // Get expense statistics
    getExpenseStats: builder.query<ExpenseStats, string>({
      query: (household_id) => `/expenses/household/${household_id}/stats`,
      providesTags: [{ type: 'Expense', id: 'STATS' }],
    }),

    // AI: Get categorization suggestion
    categorizWithAI: builder.mutation<AICategorizeResponse, AICategorizeRequest>({
      query: (data) => ({
        url: '/expenses/ai/categorize',
        method: 'POST',
        body: data,
      }),
    }),

    // AI: Extract receipt data via OCR
    extractReceiptData: builder.mutation<ReceiptOCRResponse, FormData>({
      query: (formData) => ({
        url: '/expenses/ai/ocr',
        method: 'POST',
        body: formData,
      }),
    }),

    // AI: Get task suggestions
    getTaskSuggestions: builder.mutation<TaskSuggestionsResponse, string>({
      query: (household_id) => ({
        url: '/expenses/ai/suggest-tasks',
        method: 'POST',
        params: { household_id },
      }),
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery,
  useCategorizWithAIMutation,
  useExtractReceiptDataMutation,
  useGetTaskSuggestionsMutation,
} = expenseApi;
