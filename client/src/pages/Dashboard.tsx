import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetDashboardQuery } from '../store/api/taskApi';
import { cn, getPriorityColor, getStageColor, getStageLabel, formatRelativeTime } from '../lib/utils';

const statCards = [
  {
    name: 'Total Tasks',
    key: 'totalTasks' as const,
    icon: ClipboardDocumentListIcon,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Completed',
    key: 'completedTasks' as const,
    icon: CheckCircleIcon,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'In Progress',
    key: 'inProgressTasks' as const,
    icon: ClockIcon,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    name: 'To Do',
    key: 'todoTasks' as const,
    icon: ExclamationCircleIcon,
    color: 'bg-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
];

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardQuery();
  const stats = data?.data;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            Failed to load dashboard
          </h3>
          <p className="mt-1 text-sm text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'High', value: stats.tasksByPriority.high, fill: '#ef4444' },
    { name: 'Medium', value: stats.tasksByPriority.medium, fill: '#f97316' },
    { name: 'Normal', value: stats.tasksByPriority.normal, fill: '#3b82f6' },
    { name: 'Low', value: stats.tasksByPriority.low, fill: '#9ca3af' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back! Here's an overview of your tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.name}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {stats[card.key]}
                </p>
              </div>
              <div className={cn('rounded-xl p-3', card.bgColor)}>
                <card.icon className={cn('h-6 w-6', card.textColor)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Tasks by Priority
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Tasks
            </h2>
            <Link
              to="/tasks"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all
            </Link>
          </div>

          {stats.recentTasks.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-slate-500">No tasks yet. Create your first task!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatRelativeTime(task.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className={cn('badge', getPriorityColor(task.priority))}>
                      {task.priority}
                    </span>
                    <span className={cn('badge', getStageColor(task.stage))}>
                      {getStageLabel(task.stage)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-8 w-32" />
        <div className="skeleton mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="skeleton h-4 w-20" />
                <div className="skeleton mt-2 h-8 w-12" />
              </div>
              <div className="skeleton h-12 w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="skeleton mb-4 h-6 w-32" />
          <div className="skeleton h-64" />
        </div>
        <div className="card p-6">
          <div className="skeleton mb-4 h-6 w-32" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
