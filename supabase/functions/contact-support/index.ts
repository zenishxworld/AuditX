// Supabase Edge Function: contact-support
// Sends a support email to zenish5712a@gmail.com via Resend

type ContactPayload = {
  fromEmail: string;
  message: string;
};

const RESEND_API = 'https://api.resend.com/emails';

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  let body: ContactPayload | null = null;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body', details: String(e) }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const fromEmail = body?.fromEmail?.trim();
  const message = body?.message?.trim();

  if (!fromEmail || !isValidEmail(fromEmail)) {
    return new Response(JSON.stringify({ error: 'Valid fromEmail is required' }), {
      status: 400,
      headers: corsHeaders
    });
  }
  if (!message || message.length < 4) {
    return new Response(JSON.stringify({ error: 'Message is too short' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  const subject = `New support message from ${fromEmail}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>AuditX Support Message</h2>
      <p><strong>From:</strong> ${fromEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    </div>
  `;

  const emailPayload = {
    from: 'AuditX Support <onboarding@resend.dev>',
    to: 'zenish5712a@gmail.com',
    subject,
    html,
  };

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
    return new Response(JSON.stringify({ error: 'Failed to send email', details: data, status: res.status }), {
      status: res.status,
      headers: corsHeaders
    });
  }

  return new Response(JSON.stringify({ success: true, delivery: data }), {
    status: 200,
    headers: corsHeaders
  });
});