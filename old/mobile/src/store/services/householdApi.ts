import { api } from './api';
import {
  Household,
  HouseholdWithMembers,
  HouseholdInvite,
  HouseholdMember,
  MemberRole,
} from '@/types';

interface CreateHouseholdRequest {
  name: string;
}

interface InviteRequest {
  email: string;
}

interface JoinHouseholdRequest {
  token: string;
}

interface UpdateMemberRoleRequest {
  role: MemberRole;
}

// Extend the base API with household endpoints
export const householdApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create household
    createHousehold: builder.mutation<Household, CreateHouseholdRequest>({
      query: (data) => ({
        url: '/households/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Household'],
    }),

    // Get user's households
    getMyHouseholds: builder.query<Household[], void>({
      query: () => '/households/mine',
      providesTags: ['Household'],
    }),

    // Get household details with members
    getHouseholdDetails: builder.query<HouseholdWithMembers, string>({
      query: (householdId) => `/households/${householdId}`,
      providesTags: (result, error, id) => [{ type: 'Household', id }],
    }),

    // List household invites
    listInvites: builder.query<HouseholdInvite[], string>({
      query: (householdId) => `/households/${householdId}/invites`,
      providesTags: (result, error, id) => [{ type: 'Household', id: `${id}-invites` }],
    }),

    // Create invite
    createInvite: builder.mutation<HouseholdInvite, { householdId: string; data: InviteRequest }>({
      query: ({ householdId, data }) => ({
        url: `/households/${householdId}/invite`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { householdId }) => [
        { type: 'Household', id: `${householdId}-invites` },
      ],
    }),

    // Cancel invite
    cancelInvite: builder.mutation<void, { householdId: string; inviteId: string }>({
      query: ({ householdId, inviteId }) => ({
        url: `/households/${householdId}/invites/${inviteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { householdId }) => [
        { type: 'Household', id: `${householdId}-invites` },
      ],
    }),

    // Join household via invite token
    joinHousehold: builder.mutation<Household, JoinHouseholdRequest>({
      query: (data) => ({
        url: '/households/join',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Household'],
    }),

    // Leave household
    leaveHousehold: builder.mutation<void, string>({
      query: (householdId) => ({
        url: `/households/${householdId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['Household'],
    }),

    // Update member role
    updateMemberRole: builder.mutation<
      HouseholdMember,
      { householdId: string; memberId: string; data: UpdateMemberRoleRequest }
    >({
      query: ({ householdId, memberId, data }) => ({
        url: `/households/${householdId}/members/${memberId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { householdId }) => [{ type: 'Household', id: householdId }],
    }),

    // Remove member
    removeMember: builder.mutation<void, { householdId: string; memberId: string }>({
      query: ({ householdId, memberId }) => ({
        url: `/households/${householdId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { householdId }) => [{ type: 'Household', id: householdId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateHouseholdMutation,
  useGetMyHouseholdsQuery,
  useGetHouseholdDetailsQuery,
  useListInvitesQuery,
  useCreateInviteMutation,
  useCancelInviteMutation,
  useJoinHouseholdMutation,
  useLeaveHouseholdMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = householdApi;
