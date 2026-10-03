import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { Lock } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('adminToken')) {
      router.push('/admin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === correctPassword) {
      localStorage.setItem('adminToken', 'true');
      router.push('/admin');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
            >
              Login
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </form>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Default: admin123</p>
        </div>
      </main>
    </>
  );
}
