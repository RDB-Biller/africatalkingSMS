import Link from 'next/link';
import Header from '@/components/Header';
import { MessageSquare, BarChart3, Shield, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">SMS Management Platform</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Send SMS via Africa&apos;s Talking and manage your message logs with ease.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Go to Dashboard <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-semibold"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <MessageSquare className="text-blue-600 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Send SMS</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Quick and easy SMS sending via Africa&apos;s Talking.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <BarChart3 className="text-green-600 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Analytics</h3>
            <p className="text-slate-600 dark:text-slate-300">Track delivery rates and view detailed logs.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <Shield className="text-purple-600 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Secure</h3>
            <p className="text-slate-600 dark:text-slate-300">Admin panel with authentication.</p>
          </div>
        </div>
      </main>
    </>
  );
}
