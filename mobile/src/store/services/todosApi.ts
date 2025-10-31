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
  endpoints: (builder: any) => ({
    // Get all todo lists for current household
    getTodoLists: builder.query({
      query: () => '/todos/lists',
      providesTags: (result: TodoList[]) =>
        result
          ? [
              ...result.map(({ id }: TodoList) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
    }),

    // Get a specific todo list with items
    getTodoList: builder.query({
      query: (listId: string) => `/todos/lists/${listId}`,
      providesTags: (result: any, error: any, id: string) => [{ type: 'Todo', id }],
    }),

    // Create a new todo list
    createTodoList: builder.mutation({
      query: (body: CreateTodoListRequest) => ({
        url: '/todos/lists',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }],
    }),

    // Create a new todo item
    createTodoItem: builder.mutation({
      query: ({ listId, item }: { listId: string; item: CreateTodoItemRequest }) => ({
        url: `/todos/lists/${listId}/items`,
        method: 'POST',
        body: item,
      }),
      invalidatesTags: (result: any, error: any, { listId }: { listId: string }) => [
        { type: 'Todo', id: listId },
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Update a todo item
    updateTodoItem: builder.mutation({
      query: ({ itemId, updates }: { itemId: string; updates: UpdateTodoItemRequest }) => ({
        url: `/todos/items/${itemId}`,
        method: 'PATCH',
        body: updates,
      }),
      // Optimistic update for toggling completion
      async onQueryStarted(
        { itemId, updates }: { itemId: string; updates: UpdateTodoItemRequest },
        { dispatch, queryFulfilled }: any
      ) {
        // Find which list this item belongs to and update it optimistically
        if (updates.is_completed !== undefined) {
          const patchResults: any[] = [];
          
          // Update all cached todo lists
          dispatch(
            todosApi.util.updateQueryData('getTodoLists', undefined, (draft: TodoList[]) => {
              for (const list of draft) {
                if (list.items) {
                  const item = list.items.find((i: TodoItem) => i.id === itemId);
                  if (item) {
                    (Object as any).assign(item, updates);
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
            patchResults.forEach((patch: any) => patch.undo());
          }
        }
      },
      invalidatesTags: (result: any, error: any, { itemId }: { itemId: string }) => [
        { type: 'Todo', id: 'LIST' },
      ],
    }),

    // Delete a todo item
    deleteTodoItem: builder.mutation({
      query: (itemId: string) => ({
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
