import type { Config } from '@netlify/functions';
import { handleLead } from '../../server/lead';

const KEYS = ['BREVO_API_KEY', 'BREVO_LIST_ID', 'SHEETS_WEBHOOK_URL', 'NOTIFY_EMAIL', 'BREVO_SENDER_EMAIL'] as const;

export default async (req: Request) => {
  const env = Object.fromEntries(KEYS.map((k) => [k, Netlify.env.get(k)]));
  return handleLead(req, env);
};

export const config: Config = { path: '/api/lead', method: 'POST' };
