import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { api } from '@/lib/api';

export default function AdminSettings() {
  const router = useRouter();
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.push('/login');
      return;
    }
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    setHealth(await api.getHealth());
    setLoading(false);
  };

  if (!router.isReady) return null;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">API Status</h2>
          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Checking...</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${health?.status === 'ok' ? 'bg-green-600' : 'bg-red-600'}`} />
              <p className="text-slate-900 dark:text-white font-semibold capitalize">{health?.status || 'Unknown'}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">System Info</h2>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Dashboard Version</span>
            <span className="font-semibold text-slate-900 dark:text-white">1.0.0</span>
          </div>
        </div>
      </main>
    </>
  );
}
