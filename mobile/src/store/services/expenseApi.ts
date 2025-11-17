import { api } from './api';
import {
  Expense,
  ExpenseWithSplits,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseSummary,
  PersonalExpenseAnalytics,
  ExpenseCategory,
} from '@/types';

interface ListExpensesParams {
  household_id?: string;
  category?: ExpenseCategory;
  is_personal?: boolean;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

interface SettleExpenseRequest {
  split_ids: string[];
}

interface SettlementResponse {
  settled_count: number;
  split_ids: string[];
  message: string;
}

interface GetAnalyticsParams {
  user_id: string;
  household_id?: string;
  months?: number;
}

// Extend the base API with expense endpoints
export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create expense
    createExpense: builder.mutation<ExpenseWithSplits, ExpenseCreate>({
      query: (data) => ({
        url: '/expenses/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Expense'],
    }),

    // List expenses with filters
    listExpenses: builder.query<Expense[], ListExpensesParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.household_id) searchParams.append('household_id', params.household_id);
        if (params.category) searchParams.append('category', params.category);
        if (params.is_personal !== undefined)
          searchParams.append('is_personal', String(params.is_personal));
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        if (params.skip) searchParams.append('skip', String(params.skip));
        if (params.limit) searchParams.append('limit', String(params.limit));

        return `/expenses/?${searchParams.toString()}`;
      },
      providesTags: ['Expense'],
    }),

    // Get expense details with splits
    getExpense: builder.query<ExpenseWithSplits, string>({
      query: (expenseId) => `/expenses/${expenseId}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),

    // Update expense
    updateExpense: builder.mutation<Expense, { expenseId: string; data: ExpenseUpdate }>({
      query: ({ expenseId, data }) => ({
        url: `/expenses/${expenseId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { expenseId }) => [
        { type: 'Expense', id: expenseId },
        'Expense',
      ],
    }),

    // Delete expense
    deleteExpense: builder.mutation<void, string>({
      query: (expenseId) => ({
        url: `/expenses/${expenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense'],
    }),

    // Settle expense splits
    settleExpense: builder.mutation<
      SettlementResponse,
      { expenseId: string; data: SettleExpenseRequest }
    >({
      query: ({ expenseId, data }) => ({
        url: `/expenses/${expenseId}/settle`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { expenseId }) => [
        { type: 'Expense', id: expenseId },
        'Expense',
      ],
    }),

    // Get household expense summary
    getHouseholdSummary: builder.query<ExpenseSummary, string>({
      query: (householdId) => `/expenses/households/${householdId}/summary`,
      providesTags: (result, error, id) => [{ type: 'Expense', id: `summary-${id}` }],
    }),

    // Get personal expense analytics
    getPersonalAnalytics: builder.query<PersonalExpenseAnalytics, GetAnalyticsParams>({
      query: ({ user_id, household_id, months = 1 }) => {
        const searchParams = new URLSearchParams();
        if (household_id) searchParams.append('household_id', household_id);
        searchParams.append('months', String(months));

        return `/expenses/users/${user_id}/analytics?${searchParams.toString()}`;
      },
      providesTags: (result, error, { user_id, household_id }) => [
        { type: 'Expense', id: `analytics-${user_id}-${household_id || 'all'}` },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateExpenseMutation,
  useListExpensesQuery,
  useLazyListExpensesQuery,
  useGetExpenseQuery,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useSettleExpenseMutation,
  useGetHouseholdSummaryQuery,
  useLazyGetHouseholdSummaryQuery,
  useGetPersonalAnalyticsQuery,
  useLazyGetPersonalAnalyticsQuery,
} = expenseApi;
