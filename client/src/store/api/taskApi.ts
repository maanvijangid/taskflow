import { apiSlice } from './apiSlice';
import {
  Task,
  ApiResponse,
  DashboardStats,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  Stage,
  Activity,
  SubTask,
  ActivityType,
} from '../../types';

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<DashboardStats>, void>({
      query: () => '/tasks/dashboard',
      providesTags: ['Dashboard'],
    }),

    getTasks: builder.query<ApiResponse<TasksResponse>, TaskFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.stage) params.append('stage', filters.stage);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.isTrashed !== undefined) params.append('isTrashed', String(filters.isTrashed));
        if (filters.search) params.append('search', filters.search);
        if (filters.view) params.append('view', filters.view);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        return `/tasks?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data?.tasks
          ? [
              ...result.data.tasks.map(({ id }) => ({ type: 'Tasks' as const, id })),
              { type: 'Tasks', id: 'LIST' },
            ]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),

    getTask: builder.query<ApiResponse<{ task: Task }>, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation<ApiResponse<{ task: Task }>, CreateTaskInput>({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Dashboard'],
    }),

    updateTask: builder.mutation<ApiResponse<{ task: Task }>, { id: string; data: UpdateTaskInput }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tasks', id: 'LIST' },
        { type: 'Task', id },
        'Dashboard',
      ],
    }),

    changeStage: builder.mutation<ApiResponse<{ task: Task }>, { id: string; stage: Stage }>({
      query: ({ id, stage }) => ({
        url: `/tasks/${id}/stage`,
        method: 'PUT',
        body: { stage },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tasks', id: 'LIST' },
        { type: 'Task', id },
        'Dashboard',
      ],
    }),

    addActivity: builder.mutation<ApiResponse<{ activity: Activity }>, { id: string; type: ActivityType; description?: string }>({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}/activity`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }],
    }),

    addSubTask: builder.mutation<ApiResponse<{ subTask: SubTask }>, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `/tasks/${id}/subtask`,
        method: 'PUT',
        body: { title },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }],
    }),

    updateSubTaskStatus: builder.mutation<ApiResponse<{ subTask: SubTask }>, { taskId: string; subTaskId: string; isCompleted: boolean }>({
      query: ({ taskId, subTaskId, isCompleted }) => ({
        url: `/tasks/${taskId}/subtask/${subTaskId}`,
        method: 'PUT',
        body: { isCompleted },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),

    trashTask: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/tasks/${id}/trash`,
        method: 'PUT',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Dashboard'],
    }),

    restoreTask: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/tasks/${id}/restore`,
        method: 'PUT',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Dashboard'],
    }),

    deleteTask: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Dashboard'],
    }),

    duplicateTask: builder.mutation<ApiResponse<{ task: Task }>, string>({
      query: (id) => ({
        url: `/tasks/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useChangeStageMutation,
  useAddActivityMutation,
  useAddSubTaskMutation,
  useUpdateSubTaskStatusMutation,
  useTrashTaskMutation,
  useRestoreTaskMutation,
  useDeleteTaskMutation,
  useDuplicateTaskMutation,
} = taskApi;
