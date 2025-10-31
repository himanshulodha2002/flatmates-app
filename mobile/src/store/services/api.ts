import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Base URL - can be configured via environment variable
// For physical devices, set EXPO_PUBLIC_API_URL to your computer's local IP
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api/v1
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create a base query with auth token injection
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
});

// Create a base query with retry logic
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 2 });

// Define the API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['User', 'Todo', 'Shopping', 'Expense'],
  endpoints: (builder) => ({
    // Example endpoint - will be extended later
    healthCheck: builder.query<{ status: string }, void>({
      query: () => '/health',
    }),
  }),
});

// Export hooks for usage in components
export const { useHealthCheckQuery } = api;
