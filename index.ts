export type SMSStatus = 'sent' | 'delivered' | 'failed' | 'pending';

export type SMSLog = {
  id?: string;
  phone: string;
  message: string;
  status: SMSStatus;
  timestamp: string;
  error?: string | null;
  statusCode?: string | null;
};

export type Stats = {
  total: number;
  today: number;
  delivered: number;
  failed: number;
  successRate: number;
};
