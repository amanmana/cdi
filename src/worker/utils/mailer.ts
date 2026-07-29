interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const GOOGLE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyM_KfWr2O-azWBy18mtEJpjOq8Pj8md6USDmqpz2Ez7irxlsJ1QixPh7qnmqz6HNefZg/exec';

export async function sendGmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    const res = await fetch(GOOGLE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
      redirect: 'follow',
    });
    console.log('Google Webhook Email Dispatch Status:', res.status);
    return res.ok || res.status === 200 || res.status === 302;
  } catch (err) {
    console.error('Google Webhook Exception:', err);
    return false;
  }
}
