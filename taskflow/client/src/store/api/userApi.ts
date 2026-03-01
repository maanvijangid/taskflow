import { apiSlice } from './apiSlice';
import { User, Notification, ApiResponse } from '../../types';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<{ users: User[] }>, void>({
      query: () => '/users',
      providesTags: ['User'],
    }),

    searchUsers: builder.query<ApiResponse<{ users: User[] }>, string>({
      query: (q) => `/users/search?q=${encodeURIComponent(q)}`,
    }),

    getNotifications: builder.query<ApiResponse<NotificationsResponse>, { unreadOnly?: boolean }>({
      query: ({ unreadOnly } = {}) => 
        `/users/notifications${unreadOnly ? '?unreadOnly=true' : ''}`,
      providesTags: ['Notifications'],
    }),

    markNotificationRead: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/users/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    updateProfile: builder.mutation<ApiResponse<{ user: User }>, { name?: string; profilePic?: string }>({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useSearchUsersQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useUpdateProfileMutation,
} = userApi;
