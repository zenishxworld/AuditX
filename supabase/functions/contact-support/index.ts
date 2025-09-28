import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// Supabase Edge Function: contact-support
// Sends a support email to zenish5712a@gmail.com via Resend

type ContactPayload = {
  fromEmail: string;
  message: string;
};

const RESEND_API = 'https://api.resend.com/emails';
const MAX_MESSAGE_LENGTH = 2000;

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-Request-Id',
  'Content-Type': 'application/json'
};

serve(async (req: Request) => {
  const requestId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).toString();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'X-Request-Id': requestId } });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED', requestId }), {
      status: 405,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }

  let body: ContactPayload | null = null;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_JSON', details: String(e), requestId }), {
      status: 400,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }

  const fromEmail = body?.fromEmail?.trim();
  const message = body?.message?.trim();

  if (!fromEmail || !isValidEmail(fromEmail)) {
    return new Response(JSON.stringify({ error: 'Valid fromEmail is required', code: 'INVALID_EMAIL', requestId }), {
      status: 400,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }
  if (!message || message.length < 4) {
    return new Response(JSON.stringify({ error: 'Message is too short', code: 'MESSAGE_TOO_SHORT', requestId }), {
      status: 400,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters`, code: 'MESSAGE_TOO_LONG', requestId }), {
      status: 400,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }

  const apiKey = (globalThis as any).Deno?.env?.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY', code: 'MISSING_ENV', requestId }), {
      status: 500,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }

  const subject = `New support message from ${fromEmail}`;
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>AuditX Support Message</h2>
      <p><strong>From:</strong> ${fromEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    </div>
  `;

  const emailPayload = {
    from: 'AuditX Support <onboarding@resend.dev>',
    to: 'zenish5712a@gmail.com',
    subject,
    html,
  };

  try {
    console.log('[contact-support] sending email', { requestId, fromEmail, contentLength: message.length });
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json().catch(() => ({ ok: false }));

    if (!res.ok) {
      console.error('[contact-support] resend error', { requestId, status: res.status, data });
      return new Response(JSON.stringify({ error: 'Failed to send email', code: 'RESEND_ERROR', details: data, status: res.status, requestId }), {
        status: res.status,
        headers: { ...corsHeaders, 'X-Request-Id': requestId }
      });
    }

    console.log('[contact-support] email sent', { requestId, delivery: data });
    return new Response(JSON.stringify({ success: true, delivery: data, requestId }), {
      status: 200,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  } catch (err) {
    console.error('[contact-support] fetch failed', { requestId, error: String(err) });
    return new Response(JSON.stringify({ error: 'Email service unavailable', code: 'RESEND_FETCH_FAILED', details: String(err), requestId }), {
      status: 502,
      headers: { ...corsHeaders, 'X-Request-Id': requestId }
    });
  }
});