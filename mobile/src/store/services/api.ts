import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Base URL - can be configured via environment variable
// For physical devices, set EXPO_PUBLIC_API_URL to your computer's local IP
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

console.log('API Base URL:', BASE_URL);

// Create a base query with auth token injection and error handling
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.token;

    // If we have a token, include it in the headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
  timeout: 30000, // 30 second timeout
});

// Enhanced base query with retry logic and error handling
const baseQueryWithRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    // Log errors in development
    if (__DEV__ && result.error) {
      console.error('API Error:', {
        endpoint: typeof args === 'string' ? args : args.url,
        error: result.error,
      });
    }

    // Handle specific error cases
    if (result.error) {
      // Network error
      if (result.error.status === 'FETCH_ERROR') {
        console.log('Network error detected. Retrying...');
      }

      // Unauthorized - token might be expired
      if (result.error.status === 401) {
        console.log('Unauthorized. Token may have expired.');
        // Could dispatch a logout action here if needed
      }
    }

    return result;
  },
  { maxRetries: 3 }
);

// Define the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['User', 'Todo', 'Shopping', 'Expense', 'Household', 'Inventory'],
  endpoints: (builder) => ({
    // Example endpoint - will be extended later
    healthCheck: builder.query<{ status: string }, void>({
      query: () => '/health',
    }),
  }),
});

// Export hooks for usage in components
export const { useHealthCheckQuery } = api;
