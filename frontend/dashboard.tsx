import { useState, useEffect, type FormEvent } from 'react';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import type { SMSLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Send, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchPhone]);

  const fetchLogs = async () => {
    setLoading(true);
    setLogs(await api.getSMSLogs()); // backend already returns newest-first
    setLoading(false);
  };

  const filteredLogs = searchPhone ? logs.filter((l) => l.phone.includes(searchPhone)) : logs;
  const totalPages = Math.max(Math.ceil(filteredLogs.length / ITEMS_PER_PAGE), 1);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSendSMS = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || !message) {
      setFeedback({ type: 'error', message: 'Phone and message required' });
      return;
    }
    setSending(true);
    const result = await api.sendSMS(phone, message);
    setSending(false);
    if (result.success) {
      setFeedback({ type: 'success', message: 'SMS sent!' });
      setPhone('');
      setMessage('');
      setTimeout(fetchLogs, 1000);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
    setTimeout(() => setFeedback(null), 4000);
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

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">SMS Dashboard</h1>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Send SMS</h2>
          <form onSubmit={handleSendSMS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="tel"
                placeholder="+233557389017"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Message ({message.length}/160)
              </label>
              <textarea
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 160))}
                maxLength={160}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Send size={18} /> {sending ? 'Sending...' : 'Send SMS'}
            </button>
          </form>
          {feedback && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                feedback.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">SMS Logs</h2>
            <button onClick={fetchLogs} className="text-blue-600 hover:text-blue-700" aria-label="Refresh">
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="mb-4 relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-300 dark:border-slate-600">
                    <tr>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Message</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Time</th>
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
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
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
