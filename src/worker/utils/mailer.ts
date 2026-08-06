import { D1Database } from '@cloudflare/workers-types';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  db?: D1Database;
}

const GOOGLE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyM_KfWr2O-azWBy18mtEJpjOq8Pj8md6USDmqpz2Ez7irxlsJ1QixPh7qnmqz6HNefZg/exec';

export async function isEmailNotificationsEnabled(db?: D1Database): Promise<boolean> {
  if (!db) return true;
  try {
    const setting = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind('email_notifications_enabled').first<{ value: string }>();
    if (setting && (setting.value === 'false' || setting.value === 'off' || setting.value === '0')) {
      return false;
    }
  } catch (err) {
    console.warn('Could not check email_notifications_enabled setting:', err);
  }
  return true;
}

export async function sendGmail({ to, subject, html, db }: SendEmailParams): Promise<boolean> {
  if (db) {
    const enabled = await isEmailNotificationsEnabled(db);
    if (!enabled) {
      console.log(`[EMAIL DISPATCH SKIPPED] To: ${to} | Subject: "${subject}" (Reason: email_notifications_enabled is OFF in System Settings)`);
      return false;
    }
  }
  try {
    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ to, subject, html }),
      redirect: 'follow',
    });
    const resText = await res.text();
    console.log('Google Webhook Email Dispatch Status:', res.status, 'Response:', resText);
    return res.ok || res.status === 200 || res.status === 302 || resText.includes('success');
  } catch (err) {
    console.error('Google Webhook Exception:', err);
    return false;
  }
}
