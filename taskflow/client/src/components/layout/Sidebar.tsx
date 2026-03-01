import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleSidebar, setSidebarOpen } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Trash', href: '/trash', icon: TrashIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isSidebarOpen } = useAppSelector((state) => state.auth);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
          isSidebarOpen ? 'w-64' : 'w-20',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/25">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold text-slate-900 dark:text-white"
              >
                TaskFlow
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/tasks' && location.pathname.startsWith('/tasks/'));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle button */}
        <div className="hidden border-t border-slate-200 p-4 dark:border-slate-800 md:block">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
