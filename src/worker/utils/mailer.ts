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
