import { api } from './api';
import {
  InventoryItem,
  InventoryItemWithDetails,
  InventoryItemCreateRequest,
  InventoryItemUpdateRequest,
  InventoryItemConsumeRequest,
  InventoryStats,
  InventoryCategory,
  InventoryLocation,
} from '@/types';

interface ListInventoryItemsParams {
  household_id: string;
  category?: InventoryCategory;
  location?: InventoryLocation;
  expiring_soon?: boolean;
  low_stock?: boolean;
}

interface GetInventoryStatsParams {
  household_id: string;
}

// Extend the base API with inventory endpoints
export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ============ Inventory Item Endpoints ============

    // Create inventory item
    createInventoryItem: builder.mutation<InventoryItem, InventoryItemCreateRequest>({
      query: (data) => ({
        url: '/inventory/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Inventory'],
    }),

    // Get inventory items for a household
    getInventoryItems: builder.query<InventoryItemWithDetails[], ListInventoryItemsParams>({
      query: ({ household_id, category, location, expiring_soon, low_stock }) => {
        const params = new URLSearchParams({ household_id });
        if (category) params.append('category', category);
        if (location) params.append('location', location);
        if (expiring_soon !== undefined) params.append('expiring_soon', String(expiring_soon));
        if (low_stock !== undefined) params.append('low_stock', String(low_stock));
        return `/inventory/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Inventory' as const, id })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    // Get single inventory item
    getInventoryItem: builder.query<InventoryItemWithDetails, string>({
      query: (itemId) => `/inventory/${itemId}`,
      providesTags: (result, error, itemId) => [{ type: 'Inventory', id: itemId }],
    }),

    // Get inventory statistics
    getInventoryStats: builder.query<InventoryStats, GetInventoryStatsParams>({
      query: ({ household_id }) => {
        const params = new URLSearchParams({ household_id });
        return `/inventory/stats?${params.toString()}`;
      },
      providesTags: ['Inventory'],
    }),

    // Update inventory item
    updateInventoryItem: builder.mutation<
      InventoryItem,
      { itemId: string; data: InventoryItemUpdateRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/inventory/${itemId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // Consume inventory item (reduce quantity)
    consumeInventoryItem: builder.mutation<
      InventoryItem | void,
      { itemId: string; data: InventoryItemConsumeRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/inventory/${itemId}/consume`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Inventory', id: itemId },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // Delete inventory item
    deleteInventoryItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: `/inventory/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateInventoryItemMutation,
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useGetInventoryStatsQuery,
  useUpdateInventoryItemMutation,
  useConsumeInventoryItemMutation,
  useDeleteInventoryItemMutation,
} = inventoryApi;
