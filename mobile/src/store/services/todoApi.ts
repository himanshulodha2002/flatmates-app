import { api } from './api';
import {
  Todo,
  TodoWithDetails,
  TodoCreateRequest,
  TodoUpdateRequest,
  TodoStatus,
  TodoStats,
} from '@/types';

interface ListTodosParams {
  household_id: string;
  status?: TodoStatus;
  assigned_to_me?: boolean;
  include_completed?: boolean;
}

interface UpdateTodoStatusRequest {
  status: TodoStatus;
}

// Extend the base API with todo endpoints
export const todoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create todo
    createTodo: builder.mutation<Todo, TodoCreateRequest>({
      query: (data) => ({
        url: '/todos/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Todo'],
    }),

    // Get todos for a household
    getTodos: builder.query<Todo[], ListTodosParams>({
      query: ({ household_id, status, assigned_to_me, include_completed }) => {
        const params = new URLSearchParams({ household_id });
        if (status) params.append('status', status);
        if (assigned_to_me !== undefined) params.append('assigned_to_me', String(assigned_to_me));
        if (include_completed !== undefined) params.append('include_completed', String(include_completed));
        return `/todos/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
    }),

    // Get single todo with details
    getTodo: builder.query<TodoWithDetails, string>({
      query: (todoId) => `/todos/${todoId}`,
      providesTags: (result, error, id) => [{ type: 'Todo', id }],
    }),

    // Update todo
    updateTodo: builder.mutation<Todo, { todoId: string; data: TodoUpdateRequest }>({
      query: ({ todoId, data }) => ({
        url: `/todos/${todoId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { todoId }) => [
        { type: 'Todo', id: todoId },
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Update todo status only
    updateTodoStatus: builder.mutation<Todo, { todoId: string; data: UpdateTodoStatusRequest }>({
      query: ({ todoId, data }) => ({
        url: `/todos/${todoId}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { todoId }) => [
        { type: 'Todo', id: todoId },
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Delete todo
    deleteTodo: builder.mutation<void, string>({
      query: (todoId) => ({
        url: `/todos/${todoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }],
    }),

    // Get todo statistics
    getTodoStats: builder.query<TodoStats, string>({
      query: (householdId) => `/todos/household/${householdId}/stats`,
      providesTags: ['Todo'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTodoMutation,
  useGetTodosQuery,
  useGetTodoQuery,
  useUpdateTodoMutation,
  useUpdateTodoStatusMutation,
  useDeleteTodoMutation,
  useGetTodoStatsQuery,
} = todoApi;
