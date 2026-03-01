import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleSidebar, clearCredentials } from '../../store/slices/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '../../store/api/userApi';
import { cn, getInitials, getAvatarColor, formatRelativeTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const [logout] = useLogoutMutation();
  const { data: notificationsData } = useGetNotificationsQuery({});
  const [markRead] = useMarkNotificationReadMutation();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearCredentials());
      toast.success('Logged out successfully');
    } catch {
      dispatch(clearCredentials());
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markRead('all').unwrap();
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Search */}
        <div className="hidden md:block">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-xl border-0 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-slate-200 focus:outline-none focus:ring-0 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-700 lg:w-80"
            />
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Menu as="div" className="relative">
          <Menu.Button className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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
            <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BellIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <Link
                          to={notification.task ? `/tasks/${notification.task.id}` : '#'}
                          className={cn(
                            'flex gap-3 px-4 py-3 transition-colors',
                            active && 'bg-slate-50 dark:bg-slate-800',
                            !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                          )}
                        >
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {notification.text}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                          )}
                        </Link>
                      )}
                    </Menu.Item>
                  ))
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white',
                  getAvatarColor(user?.name || '')
                )}
              >
                {getInitials(user?.name || '')}
              </div>
            )}
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 md:block">
              {user?.name}
            </span>
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
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        active ? 'bg-slate-100 dark:bg-slate-800' : '',
                        'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        active ? 'bg-slate-100 dark:bg-slate-800' : '',
                        'text-red-600 dark:text-red-400'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
