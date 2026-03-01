import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '../../lib/utils';

export default function Layout() {
  const { isSidebarOpen } = useAppSelector((state) => state.auth);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        )}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
