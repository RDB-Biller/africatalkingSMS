import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import type { SMSLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Download, Search, Filter } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function AdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.push('/login');
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchPhone, filterStatus]);

  const fetchLogs = async () => {
    setLoading(true);
    setLogs(await api.getSMSLogs());
    setLoading(false);
  };

  let filteredLogs = logs;
  if (searchPhone) filteredLogs = filteredLogs.filter((l) => l.phone.includes(searchPhone));
  if (filterStatus !== 'all') filteredLogs = filteredLogs.filter((l) => l.status === filterStatus);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / ITEMS_PER_PAGE), 1);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportToCSV = () => {
    const headers = ['Phone', 'Message', 'Status', 'Timestamp'];
    const rows = filteredLogs.map((log) => [log.phone, log.message, log.status, log.timestamp]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  if (!router.isReady) return null;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMS Logs</h1>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by phone..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-3 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-300 dark:border-slate-600">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-900 dark:text-white">Phone</th>
                      <th className="text-left py-3 px-4 text-slate-900 dark:text-white">Message</th>
                      <th className="text-left py-3 px-4 text-slate-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 text-slate-900 dark:text-white">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <td className="py-3 px-4 text-slate-900 dark:text-white">{log.phone}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                          {log.message}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${statusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-600 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
