import axios from 'axios';
import type { SMSLog } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const client = axios.create({ baseURL: API_URL, timeout: 10000 });

// Pulls the backend's own error message out of a failed response (e.g.
// "Invalid From Number") instead of flattening every failure down to a
// generic string -- the one thing worth improving on a straight port,
// since a vague "Failed to send SMS" is exactly what makes a bad
// sender-ID/credential problem hard to diagnose later.
function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || error.message || fallback;
  }
  return fallback;
}

export const api = {
  async getSMSLogs(): Promise<SMSLog[]> {
    try {
      const { data } = await client.get('/sms-logs');
      return Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      console.error('Failed to fetch SMS logs:', error);
      return [];
    }
  },

  async sendSMS(phone: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      await client.post('/send-sms', { phone, message });
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      return { success: false, message: errorMessage(error, 'Failed to send SMS') };
    }
  },

  async getHealth(): Promise<{ status: string }> {
    try {
      const { data } = await client.get('/health');
      return data;
    } catch {
      return { status: 'offline' };
    }
  },
};
