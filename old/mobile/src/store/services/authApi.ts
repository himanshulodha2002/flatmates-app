import { api } from './api';
import { User } from '@/types';

interface GoogleLoginRequest {
  id_token: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface UserUpdateRequest {
  full_name?: string;
  profile_picture_url?: string;
}

// Extend the base API with auth endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<TokenResponse, GoogleLoginRequest>({
      query: (credentials) => ({
        url: '/auth/google/mobile',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<User, UserUpdateRequest>({
      query: (data) => ({
        url: '/auth/me',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGoogleLoginMutation,
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useLogoutMutation,
} = authApi;
