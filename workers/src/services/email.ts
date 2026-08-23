import type { Env } from '../types';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface ResendResponse {
  id: string;
}

export async function sendEmail(
  env: Env,
  options: SendEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, subject, html, from } = options;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || 'StockFlow <noreply@stockflow.app>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Resend API error: ${response.status} - ${errorText}` };
    }

    const data = (await response.json()) as ResendResponse;
    return { success: true, id: data.id };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
