import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  PlusIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  useGetTaskQuery,
  useChangeStageMutation,
  useAddSubTaskMutation,
  useUpdateSubTaskStatusMutation,
  useTrashTaskMutation,
  useAddActivityMutation,
} from '../store/api/taskApi';
import { Stage } from '../types';
import {
  cn,
  getPriorityColor,
  getStageColor,
  getStageLabel,
  formatDate,
  formatRelativeTime,
  getInitials,
  getAvatarColor,
} from '../lib/utils';
import { joinTaskRoom, leaveTaskRoom, getSocket } from '../lib/socket';
import TaskModal from '../components/tasks/TaskModal';
import toast from 'react-hot-toast';

const stages: { value: Stage; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');
  const [newComment, setNewComment] = useState('');

  const { data, isLoading, error, refetch } = useGetTaskQuery(id!, { skip: !id });
  const [changeStage] = useChangeStageMutation();
  const [addSubTask, { isLoading: isAddingSubTask }] = useAddSubTaskMutation();
  const [updateSubTaskStatus] = useUpdateSubTaskStatusMutation();
  const [trashTask] = useTrashTaskMutation();
  const [addActivity, { isLoading: isAddingComment }] = useAddActivityMutation();

  const task = data?.data?.task;

  useEffect(() => {
    if (id) {
      joinTaskRoom(id);

      const socket = getSocket();
      if (socket) {
        socket.on('task:updated', () => refetch());
        socket.on('subtask:added', () => refetch());
        socket.on('subtask:updated', () => refetch());
        socket.on('activity:added', () => refetch());
      }

      return () => {
        leaveTaskRoom(id);
        if (socket) {
          socket.off('task:updated');
          socket.off('subtask:added');
          socket.off('subtask:updated');
          socket.off('activity:added');
        }
      };
    }
  }, [id, refetch]);

  const handleStageChange = async (stage: Stage) => {
    try {
      await changeStage({ id: id!, stage }).unwrap();
      toast.success(`Task marked as ${getStageLabel(stage)}`);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTask.trim()) return;

    try {
      await addSubTask({ id: id!, title: newSubTask.trim() }).unwrap();
      setNewSubTask('');
      toast.success('Subtask added');
    } catch {
      toast.error('Failed to add subtask');
    }
  };

  const handleSubTaskToggle = async (subTaskId: string, isCompleted: boolean) => {
    try {
      await updateSubTaskStatus({
        taskId: id!,
        subTaskId,
        isCompleted,
      }).unwrap();
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addActivity({
        id: id!,
        type: 'COMMENTED',
        description: newComment.trim(),
      }).unwrap();
      setNewComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await trashTask(id!).unwrap();
      toast.success('Task moved to trash');
      navigate('/tasks');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return <TaskDetailSkeleton />;
  }

  if (error || !task) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            Task not found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            The task you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/tasks" className="btn-primary mt-4">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  const completedSubTasks = task.subTasks.filter((st) => st.isCompleted).length;
  const totalSubTasks = task.subTasks.length;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={cn('badge', getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            <span className={cn('badge', getStageColor(task.stage))}>
              {getStageLabel(task.stage)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn-secondary"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {task.title}
            </h1>
            {task.description && (
              <p className="mt-4 whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                {task.description}
              </p>
            )}
          </motion.div>

          {/* Stage Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Change Stage
            </h2>
            <div className="flex flex-wrap gap-2">
              {stages.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStageChange(s.value)}
                  disabled={task.stage === s.value}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    task.stage === s.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Subtasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Subtasks
              </h2>
              {totalSubTasks > 0 && (
                <span className="text-sm text-slate-500">
                  {completedSubTasks}/{totalSubTasks} completed
                </span>
              )}
            </div>

            {totalSubTasks > 0 && (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {task.subTasks.map((subTask) => (
                <div
                  key={subTask.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <button
                    onClick={() => handleSubTaskToggle(subTask.id, !subTask.isCompleted)}
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                      subTask.isCompleted
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-slate-300 hover:border-primary-500 dark:border-slate-600'
                    )}
                  >
                    {subTask.isCompleted && <CheckIcon className="h-3 w-3" />}
                  </button>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      subTask.isCompleted
                        ? 'text-slate-400 line-through'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {subTask.title}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubTask} className="mt-4 flex gap-2">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="Add a subtask..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={isAddingSubTask || !newSubTask.trim()}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </form>
          </motion.div>

          {/* Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Activity
            </h2>

            <form onSubmit={handleAddComment} className="mb-6 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={isAddingComment || !newComment.trim()}
                className="btn-primary"
              >
                Post
              </button>
            </form>

            <div className="space-y-4">
              {task.activities?.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  {activity.user.profilePic ? (
                    <img
                      src={activity.user.profilePic}
                      alt={activity.user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white',
                        getAvatarColor(activity.user.name)
                      )}
                    >
                      {getInitials(activity.user.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {activity.user.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {activity.description || activity.type.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}

              {(!task.activities || task.activities.length === 0) && (
                <p className="text-center text-sm text-slate-500">No activity yet</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Details
            </h2>

            <div className="space-y-4">
              {/* Creator */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created by</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {task.user.name}
                  </p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assigned to</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {task.assignee?.name || task.assigneeEmail || 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Due date</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* Created */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <ClockIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatRelativeTime(task.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />
    </div>
  );
}

function TaskDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <div className="skeleton h-6 w-32" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-20 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton mt-4 h-20" />
          </div>
          <div className="card p-6">
            <div className="skeleton h-6 w-32" />
            <div className="mt-4 flex gap-2">
              <div className="skeleton h-10 w-24 rounded-lg" />
              <div className="skeleton h-10 w-24 rounded-lg" />
              <div className="skeleton h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="skeleton h-6 w-20" />
          <div className="mt-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
