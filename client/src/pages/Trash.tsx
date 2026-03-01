import { motion } from 'framer-motion';
import {
  TrashIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useGetTasksQuery, useRestoreTaskMutation, useDeleteTaskMutation } from '../store/api/taskApi';
import { cn, getPriorityColor, getStageColor, getStageLabel, formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

export default function Trash() {
  const { data, isLoading, error } = useGetTasksQuery({ isTrashed: true });
  const [restoreTask] = useRestoreTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const tasks = data?.data?.tasks || [];

  const handleRestore = async (taskId: string) => {
    try {
      await restoreTask(taskId).unwrap();
      toast.success('Task restored');
    } catch {
      toast.error('Failed to restore task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('This will permanently delete the task. Are you sure?')) return;

    try {
      await deleteTask(taskId).unwrap();
      toast.success('Task permanently deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return <TrashSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            Failed to load trash
          </h3>
          <p className="mt-1 text-sm text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trash</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {tasks.length} deleted task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex h-64 items-center justify-center"
        >
          <div className="text-center">
            <TrashIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
              Trash is empty
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Deleted tasks will appear here
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Task
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">
                  Priority
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell">
                  Stage
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 lg:table-cell">
                  Deleted
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <span className={cn('badge', getPriorityColor(task.priority))}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <span className={cn('badge', getStageColor(task.stage))}>
                      {getStageLabel(task.stage)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-500 lg:table-cell">
                    {formatRelativeTime(task.updatedAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRestore(task.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                        title="Restore"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Delete permanently"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}

function TrashSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-8 w-24" />
        <div className="skeleton mt-2 h-4 w-32" />
      </div>
      <div className="card">
        <div className="skeleton h-10 rounded-none" />
        {[1, 2, 3].map((row) => (
          <div key={row} className="skeleton mt-1 h-16 rounded-none" />
        ))}
      </div>
    </div>
  );
}
