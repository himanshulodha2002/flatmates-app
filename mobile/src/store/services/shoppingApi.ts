import { api } from './api';
import {
  ShoppingList,
  ShoppingListWithItems,
  ShoppingListItem,
  ShoppingListItemWithDetails,
  ItemCategory,
  ShoppingListCreateRequest,
  ShoppingListUpdateRequest,
  ShoppingListItemCreateRequest,
  ShoppingListItemUpdateRequest,
  ShoppingListItemPurchaseUpdateRequest,
  ItemCategoryCreateRequest,
  ShoppingListStats,
  ShoppingListStatus,
} from '@/types';

interface ListShoppingListsParams {
  household_id: string;
  status?: ShoppingListStatus;
  include_archived?: boolean;
}

interface GetShoppingListParams {
  list_id: string;
  category?: string;
  is_purchased?: boolean;
}

interface ListShoppingListItemsParams {
  list_id: string;
  category?: string;
  is_purchased?: boolean;
}

interface ListCategoriesParams {
  household_id?: string;
}

// Extend the base API with shopping list endpoints
export const shoppingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ============ Shopping List Endpoints ============

    // Create shopping list
    createShoppingList: builder.mutation<ShoppingList, ShoppingListCreateRequest>({
      query: (data) => ({
        url: '/shopping-lists/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shopping'],
    }),

    // Get shopping lists for a household
    getShoppingLists: builder.query<ShoppingList[], ListShoppingListsParams>({
      query: ({ household_id, status, include_archived }) => {
        const params = new URLSearchParams({ household_id });
        if (status) params.append('status', status);
        if (include_archived !== undefined) params.append('include_archived', String(include_archived));
        return `/shopping-lists/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Shopping' as const, id })),
              { type: 'Shopping', id: 'LIST' },
            ]
          : [{ type: 'Shopping', id: 'LIST' }],
    }),

    // Get single shopping list with items
    getShoppingList: builder.query<ShoppingListWithItems, GetShoppingListParams>({
      query: ({ list_id, category, is_purchased }) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (is_purchased !== undefined) params.append('is_purchased', String(is_purchased));
        const queryString = params.toString();
        return `/shopping-lists/${list_id}${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result, error, { list_id }) => [
        { type: 'Shopping', id: list_id },
        { type: 'Shopping', id: 'ITEMS' },
      ],
    }),

    // Update shopping list
    updateShoppingList: builder.mutation<ShoppingList, { listId: string; data: ShoppingListUpdateRequest }>({
      query: ({ listId, data }) => ({
        url: `/shopping-lists/${listId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'Shopping', id: listId },
        { type: 'Shopping', id: 'LIST' },
      ],
    }),

    // Delete shopping list
    deleteShoppingList: builder.mutation<void, string>({
      query: (listId) => ({
        url: `/shopping-lists/${listId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Shopping', id: 'LIST' }],
    }),

    // Get shopping list statistics
    getShoppingListStats: builder.query<ShoppingListStats, string>({
      query: (listId) => `/shopping-lists/${listId}/stats`,
      providesTags: (result, error, listId) => [{ type: 'Shopping', id: listId }],
    }),

    // ============ Shopping List Item Endpoints ============

    // Create shopping list item
    createShoppingListItem: builder.mutation<ShoppingListItem, { listId: string; data: ShoppingListItemCreateRequest }>({
      query: ({ listId, data }) => ({
        url: `/shopping-lists/${listId}/items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'Shopping', id: listId },
        { type: 'Shopping', id: 'ITEMS' },
      ],
    }),

    // Get shopping list items
    getShoppingListItems: builder.query<ShoppingListItem[], ListShoppingListItemsParams>({
      query: ({ list_id, category, is_purchased }) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (is_purchased !== undefined) params.append('is_purchased', String(is_purchased));
        const queryString = params.toString();
        return `/shopping-lists/${list_id}/items${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result, error, { list_id }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Shopping' as const, id: `${list_id}-${id}` })),
              { type: 'Shopping', id: 'ITEMS' },
            ]
          : [{ type: 'Shopping', id: 'ITEMS' }],
    }),

    // Update shopping list item
    updateShoppingListItem: builder.mutation<
      ShoppingListItem,
      { listId: string; itemId: string; data: ShoppingListItemUpdateRequest }
    >({
      query: ({ listId, itemId, data }) => ({
        url: `/shopping-lists/${listId}/items/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { listId, itemId }) => [
        { type: 'Shopping', id: listId },
        { type: 'Shopping', id: `${listId}-${itemId}` },
        { type: 'Shopping', id: 'ITEMS' },
      ],
    }),

    // Toggle item purchase status (optimized for real-time checkoff)
    toggleItemPurchase: builder.mutation<
      ShoppingListItem,
      { listId: string; itemId: string; data: ShoppingListItemPurchaseUpdateRequest }
    >({
      query: ({ listId, itemId, data }) => ({
        url: `/shopping-lists/${listId}/items/${itemId}/purchase`,
        method: 'PATCH',
        body: data,
      }),
      // Optimistic update for better UX
      async onQueryStarted({ listId, itemId, data }, { dispatch, queryFulfilled }) {
        // Optimistically update the cache
        const patchResult = dispatch(
          shoppingApi.util.updateQueryData('getShoppingList', { list_id: listId }, (draft) => {
            const item = draft.items.find((i) => i.id === itemId);
            if (item) {
              item.is_purchased = data.is_purchased;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { listId, itemId }) => [
        { type: 'Shopping', id: listId },
        { type: 'Shopping', id: `${listId}-${itemId}` },
      ],
    }),

    // Delete shopping list item
    deleteShoppingListItem: builder.mutation<void, { listId: string; itemId: string }>({
      query: ({ listId, itemId }) => ({
        url: `/shopping-lists/${listId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'Shopping', id: listId },
        { type: 'Shopping', id: 'ITEMS' },
      ],
    }),

    // ============ Category Endpoints ============

    // Get item categories
    getItemCategories: builder.query<ItemCategory[], ListCategoriesParams>({
      query: ({ household_id }) => {
        const params = new URLSearchParams();
        if (household_id) params.append('household_id', household_id);
        const queryString = params.toString();
        return `/shopping-lists/categories${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Shopping'],
    }),

    // Create custom category
    createItemCategory: builder.mutation<ItemCategory, ItemCategoryCreateRequest>({
      query: (data) => ({
        url: '/shopping-lists/categories',
        method: 'POST',
        body: data,
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
  useUpdateShoppingListMutation,
  useDeleteShoppingListMutation,
  useGetShoppingListStatsQuery,
  useCreateShoppingListItemMutation,
  useGetShoppingListItemsQuery,
  useUpdateShoppingListItemMutation,
  useToggleItemPurchaseMutation,
  useDeleteShoppingListItemMutation,
  useGetItemCategoriesQuery,
  useCreateItemCategoryMutation,
} = shoppingApi;
