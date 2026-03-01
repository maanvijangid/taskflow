import { apiSlice } from './apiSlice';
import { User, ApiResponse } from '../../types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

interface GoogleLoginRequest {
  credential: string;
}

interface AuthResponse {
  user: User;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Tasks', 'Dashboard', 'Notifications'],
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tasks', 'Dashboard', 'Notifications'],
    }),

    googleLogin: builder.mutation<ApiResponse<AuthResponse>, GoogleLoginRequest>({
      query: (data) => ({
        url: '/auth/google-login',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tasks', 'Dashboard', 'Notifications'],
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Tasks', 'Dashboard', 'Notifications', 'User'],
    }),

    getMe: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
