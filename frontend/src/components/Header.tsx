import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, MessageSquare } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const isAdmin = typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/');
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <MessageSquare size={22} className="text-blue-600" />
          SMS Dashboard
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-blue-600">
            Dashboard
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin" className="text-slate-600 dark:text-slate-300 hover:text-blue-600">
                Admin
              </Link>
              <Link href="/admin/logs" className="text-slate-600 dark:text-slate-300 hover:text-blue-600">
                Logs
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-red-600"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-blue-600">
              Admin Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
