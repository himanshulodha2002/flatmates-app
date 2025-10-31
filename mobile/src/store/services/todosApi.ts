import { api } from './api';

export interface TodoList {
  id: string;
  household_id: string;
  name: string;
  created_by: string;
  created_at: string;
  items?: TodoItem[];
}

export interface TodoItem {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_user_id?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoListRequest {
  name: string;
}

export interface CreateTodoItemRequest {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_user_id?: string;
}

export interface UpdateTodoItemRequest {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_user_id?: string;
  is_completed?: boolean;
}

export const todosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all todo lists for current household
    getTodoLists: builder.query<TodoList[], void>({
      query: () => '/todos/lists',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
    }),

    // Get a specific todo list with items
    getTodoList: builder.query<TodoList, string>({
      query: (listId) => `/todos/lists/${listId}`,
      providesTags: (result, error, id) => [{ type: 'Todo', id }],
    }),

    // Create a new todo list
    createTodoList: builder.mutation<TodoList, CreateTodoListRequest>({
      query: (body) => ({
        url: '/todos/lists',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }],
    }),

    // Create a new todo item
    createTodoItem: builder.mutation<
      TodoItem,
      { listId: string; item: CreateTodoItemRequest }
    >({
      query: ({ listId, item }) => ({
        url: `/todos/lists/${listId}/items`,
        method: 'POST',
        body: item,
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'Todo', id: listId },
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Update a todo item
    updateTodoItem: builder.mutation<
      TodoItem,
      { itemId: string; updates: UpdateTodoItemRequest }
    >({
      query: ({ itemId, updates }) => ({
        url: `/todos/items/${itemId}`,
        method: 'PATCH',
        body: updates,
      }),
      // Optimistic update for toggling completion
      async onQueryStarted({ itemId, updates }, { dispatch, queryFulfilled }) {
        // Find which list this item belongs to and update it optimistically
        if (updates.is_completed !== undefined) {
          const patchResults: any[] = [];
          
          // Update all cached todo lists
          dispatch(
            todosApi.util.updateQueryData('getTodoLists', undefined, (draft) => {
              for (const list of draft) {
                if (list.items) {
                  const item = list.items.find((i) => i.id === itemId);
                  if (item) {
                    Object.assign(item, updates);
                    if (updates.is_completed) {
                      item.completed_at = new Date().toISOString();
                    } else {
                      item.completed_at = undefined;
                    }
                  }
                }
              }
            })
          );

          try {
            await queryFulfilled;
          } catch {
            patchResults.forEach((patch) => patch.undo());
          }
        }
      },
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Delete a todo item
    deleteTodoItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: `/todos/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTodoListsQuery,
  useGetTodoListQuery,
  useCreateTodoListMutation,
  useCreateTodoItemMutation,
  useUpdateTodoItemMutation,
  useDeleteTodoItemMutation,
} = todosApi;
