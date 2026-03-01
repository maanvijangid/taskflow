import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../../store/api/taskApi';
import { Task, CreateTaskInput, Priority, Stage } from '../../types';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'HIGH', label: 'High', color: 'bg-red-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-orange-500' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-500' },
  { value: 'LOW', label: 'Low', color: 'bg-gray-400' },
];

const stages: { value: Stage; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const isEditing = !!task;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'NORMAL',
      stage: 'TODO',
      assigneeEmail: '',
      dueDate: null,
    },
  });

  const selectedPriority = watch('priority');
  const selectedStage = watch('stage');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        stage: task.stage,
        assigneeEmail: task.assigneeEmail || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
      });
    } else {
      reset({
        title: '',
        description: '',
        priority: 'NORMAL',
        stage: 'TODO',
        assigneeEmail: '',
        dueDate: null,
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        assigneeEmail: data.assigneeEmail || null,
      };

      if (isEditing) {
        await updateTask({ id: task.id, data: payload }).unwrap();
        toast.success('Task updated successfully');
      } else {
        await createTask(payload).unwrap();
        toast.success('Task created successfully');
      }
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      toast.error(err?.data?.error || 'Failed to save task');
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                  <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isEditing ? 'Edit Task' : 'Create New Task'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="label">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="title"
                        type="text"
                        {...register('title', { required: 'Title is required' })}
                        className={cn('input', errors.title && 'input-error')}
                        placeholder="Enter task title"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="label">
                        Description
                      </label>
                      <textarea
                        id="description"
                        {...register('description')}
                        rows={3}
                        className="input resize-none"
                        placeholder="Add a description..."
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="label">Priority</label>
                      <div className="flex flex-wrap gap-2">
                        {priorities.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setValue('priority', p.value)}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              selectedPriority === p.value
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            )}
                          >
                            <span className={cn('h-2 w-2 rounded-full', p.color)} />
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stage */}
                    <div>
                      <label className="label">Stage</label>
                      <div className="flex flex-wrap gap-2">
                        {stages.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setValue('stage', s.value)}
                            className={cn(
                              'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                              selectedStage === s.value
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assignee Email */}
                    <div>
                      <label htmlFor="assigneeEmail" className="label">
                        Assign to (Email)
                      </label>
                      <input
                        id="assigneeEmail"
                        type="email"
                        {...register('assigneeEmail')}
                        className="input"
                        placeholder="colleague@example.com"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Enter the email of the person you want to assign this task to
                      </p>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label htmlFor="dueDate" className="label">
                        Due Date
                      </label>
                      <input
                        id="dueDate"
                        type="date"
                        {...register('dueDate')}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Saving...
                        </span>
                      ) : isEditing ? (
                        'Update Task'
                      ) : (
                        'Create Task'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
