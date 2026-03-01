import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition, Dialog } from '@headlessui/react';
import {
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useGetTasksQuery, useTrashTaskMutation, useDuplicateTaskMutation } from '../store/api/taskApi';
import { Task, Stage, Priority, TaskFilters } from '../types';
import { cn, getPriorityColor, getPriorityDot, getStageColor, getStageBgColor, getStageLabel, formatDate, getInitials, getAvatarColor } from '../lib/utils';
import TaskModal from '../components/tasks/TaskModal';
import toast from 'react-hot-toast';

const stages: Stage[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

export default function Tasks() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filters, setFilters] = useState<TaskFilters>({ isTrashed: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data, isLoading, error } = useGetTasksQuery({
    ...filters,
    search: searchQuery || undefined,
  });

  const tasks = data?.data?.tasks || [];

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const tasksByStage = stages.reduce((acc, stage) => {
    acc[stage] = tasks.filter((task) => task.stage === stage);
    return acc;
  }, {} as Record<Stage, Task[]>);

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            Failed to load tasks
          </h3>
          <p className="mt-1 text-sm text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <button onClick={handleCreateTask} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          New Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="btn-secondary">
              <FunnelIcon className="h-5 w-5" />
              Filter
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-medium text-slate-500">Priority</p>
                  {(['HIGH', 'MEDIUM', 'NORMAL', 'LOW'] as Priority[]).map((priority) => (
                    <Menu.Item key={priority}>
                      {({ active }) => (
                        <button
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              priority: f.priority === priority ? undefined : priority,
                            }))
                          }
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                            active && 'bg-slate-100 dark:bg-slate-800',
                            filters.priority === priority && 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          )}
                        >
                          <span className={cn('h-2 w-2 rounded-full', getPriorityDot(priority))} />
                          {priority}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
                <div className="border-t border-slate-200 p-2 dark:border-slate-700">
                  <p className="px-2 py-1 text-xs font-medium text-slate-500">View</p>
                  {(['all', 'created', 'assigned'] as const).map((viewType) => (
                    <Menu.Item key={viewType}>
                      {({ active }) => (
                        <button
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              view: viewType === 'all' ? undefined : viewType,
                            }))
                          }
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm capitalize',
                            active && 'bg-slate-100 dark:bg-slate-800',
                            (filters.view || 'all') === viewType && 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          )}
                        >
                          {viewType === 'all' ? 'All Tasks' : `${viewType} by me`}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setView('board')}
              className={cn(
                'rounded-lg p-2 transition-colors',
                view === 'board'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'rounded-lg p-2 transition-colors',
                view === 'list'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TasksSkeleton view={view} />
      ) : view === 'board' ? (
        <BoardView
          tasksByStage={tasksByStage}
          onEdit={handleEditTask}
        />
      ) : (
        <ListView tasks={tasks} onEdit={handleEditTask} />
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </div>
  );
}

function BoardView({
  tasksByStage,
  onEdit,
}: {
  tasksByStage: Record<Stage, Task[]>;
  onEdit: (task: Task) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stages.map((stage) => (
        <div
          key={stage}
          className={cn(
            'rounded-xl border border-slate-200 p-4 dark:border-slate-800',
            getStageBgColor(stage)
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('badge', getStageColor(stage))}>
                {getStageLabel(stage)}
              </span>
              <span className="text-sm text-slate-500">
                {tasksByStage[stage].length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasksByStage[stage].map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEdit} />
              ))}
            </AnimatePresence>

            {tasksByStage[stage].length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const [trashTask] = useTrashTaskMutation();
  const [duplicateTask] = useDuplicateTaskMutation();

  const handleTrash = async () => {
    try {
      await trashTask(task.id).unwrap();
      toast.success('Task moved to trash');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateTask(task.id).unwrap();
      toast.success('Task duplicated');
    } catch {
      toast.error('Failed to duplicate task');
    }
  };

  const completedSubTasks = task.subTasks.filter((st) => st.isCompleted).length;
  const totalSubTasks = task.subTasks.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card card-hover p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/tasks/${task.id}`}
          className="flex-1 text-sm font-medium text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
        >
          {task.title}
        </Link>

        <Menu as="div" className="relative">
          <Menu.Button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onEdit(task)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
                        active && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDuplicate}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
                        active && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Duplicate
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleTrash}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400',
                        active && 'bg-red-50 dark:bg-red-900/20'
                      )}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', getPriorityDot(task.priority))} />
          <span className="text-xs text-slate-500">{task.priority}</span>
        </div>

        {totalSubTasks > 0 && (
          <span className="text-xs text-slate-500">
            {completedSubTasks}/{totalSubTasks} subtasks
          </span>
        )}
      </div>

      {task.dueDate && (
        <div className="mt-2 text-xs text-slate-500">
          Due: {formatDate(task.dueDate)}
        </div>
      )}

      {task.assignee && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {task.assignee.profilePic ? (
            <img
              src={task.assignee.profilePic}
              alt={task.assignee.name}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white',
                getAvatarColor(task.assignee.name)
              )}
            >
              {getInitials(task.assignee.name)}
            </div>
          )}
          <span className="text-xs text-slate-500">{task.assignee.name}</span>
        </div>
      )}
    </motion.div>
  );
}

function ListView({ tasks, onEdit }: { tasks: Task[]; onEdit: (task: Task) => void }) {
  const [trashTask] = useTrashTaskMutation();

  const handleTrash = async (taskId: string) => {
    try {
      await trashTask(taskId).unwrap();
      toast.success('Task moved to trash');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="card flex h-64 items-center justify-center">
        <p className="text-slate-500">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
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
              Assignee
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
                <Link
                  to={`/tasks/${task.id}`}
                  className="font-medium text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                >
                  {task.title}
                </Link>
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
              <td className="hidden px-4 py-4 lg:table-cell">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    {task.assignee.profilePic ? (
                      <img
                        src={task.assignee.profilePic}
                        alt={task.assignee.name}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white',
                          getAvatarColor(task.assignee.name)
                        )}
                      >
                        {getInitials(task.assignee.name)}
                      </div>
                    )}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(task)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleTrash(task.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TasksSkeleton({ view }: { view: 'board' | 'list' }) {
  if (view === 'board') {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((col) => (
          <div key={col} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="skeleton h-6 w-24" />
            {[1, 2, 3].map((card) => (
              <div key={card} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="skeleton h-10 rounded-none" />
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="skeleton mt-1 h-16 rounded-none" />
      ))}
    </div>
  );
}
