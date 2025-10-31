import { api } from './api';
import {
  ShoppingList,
  ShoppingListSummary,
  ShoppingItem,
  CreateShoppingListRequest,
  CreateShoppingItemRequest,
  UpdateShoppingItemRequest,
} from '@/types';

// Extend the base API with shopping endpoints
export const shoppingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Shopping Lists
    createShoppingList: builder.mutation<ShoppingList, CreateShoppingListRequest>({
      query: (data) => ({
        url: '/shopping/lists',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shopping'],
    }),
    
    getShoppingLists: builder.query<ShoppingListSummary[], void>({
      query: () => '/shopping/lists',
      providesTags: ['Shopping'],
    }),
    
    getShoppingList: builder.query<ShoppingList, string>({
      query: (listId) => `/shopping/lists/${listId}`,
      providesTags: (result, error, id) => [{ type: 'Shopping', id }],
    }),
    
    // Shopping Items
    addItemToList: builder.mutation<
      ShoppingItem,
      { listId: string; item: CreateShoppingItemRequest }
    >({
      query: ({ listId, item }) => ({
        url: `/shopping/lists/${listId}/items`,
        method: 'POST',
        body: item,
      }),
      invalidatesTags: (result, error, { listId }) => [
        'Shopping',
        { type: 'Shopping', id: listId },
      ],
    }),
    
    updateShoppingItem: builder.mutation<
      ShoppingItem,
      { itemId: string; updates: UpdateShoppingItemRequest }
    >({
      query: ({ itemId, updates }) => ({
        url: `/shopping/items/${itemId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Shopping'],
    }),
    
    deleteShoppingItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: `/shopping/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shopping'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateShoppingListMutation,
  useGetShoppingListsQuery,
  useGetShoppingListQuery,
  useAddItemToListMutation,
  useUpdateShoppingItemMutation,
  useDeleteShoppingItemMutation,
} = shoppingApi;
