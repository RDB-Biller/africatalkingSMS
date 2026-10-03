import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import type { SMSLog, Stats } from '@/types';
import { BarChart3, AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.push('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const logsData = await api.getSMSLogs();
    setLogs(logsData);

    const total = logsData.length;
    const today = logsData.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
    const delivered = logsData.filter((l) => l.status === 'delivered').length;
    const failed = logsData.filter((l) => l.status === 'failed').length;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    setStats({ total, today, delivered, failed, successRate });
    setLoading(false);
  };

  if (!router.isReady) return null;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Admin Analytics</h1>

        {loading ? (
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<BarChart3 className="text-blue-600" />} title="Total SMS" value={stats?.total || 0} />
              <StatCard icon={<Clock className="text-yellow-600" />} title="Today" value={stats?.today || 0} />
              <StatCard
                icon={<TrendingUp className="text-green-600" />}
                title="Success Rate"
                value={`${stats?.successRate || 0}%`}
              />
              <StatCard icon={<AlertCircle className="text-red-600" />} title="Failed" value={stats?.failed || 0} />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Recent Activity</h2>
                <div className="space-y-2">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{log.phone}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{log.message}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                          log.status === 'delivered'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Status Breakdown</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Delivered</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stats?.delivered}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stats && stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-700 dark:text-slate-300">Failed</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stats?.failed}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${stats && stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({ icon, title, value }: { icon: ReactNode; title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      {icon}
    </div>
  );
}
