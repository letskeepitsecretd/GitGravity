import { NextResponse } from 'next/server';

export async function GET() {
  const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)?.replace(/\/$/, '');
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const diagnostics = {
    env: {
      has_KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      has_UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      has_KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      has_UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      resolved_url: KV_URL || 'NONE',
      token_length: KV_TOKEN ? KV_TOKEN.length : 0,
    },
    connection: {
      status: 'NOT_TESTED',
      response_ok: false,
      response_status: 0,
      result: null as any,
      error: null as string | null,
    }
  };

  if (!KV_URL || !KV_TOKEN) {
    diagnostics.connection.status = 'SKIPPED: Missing environment variables';
    return NextResponse.json(diagnostics);
  }

  try {
    const testKey = 'gitgravity:cards';
    const res = await fetch(`${KV_URL}/get/${testKey}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
      },
    });

    diagnostics.connection.response_ok = res.ok;
    diagnostics.connection.response_status = res.status;

    if (res.ok) {
      const data = await res.json();
      diagnostics.connection.status = 'SUCCESS';
      diagnostics.connection.result = data;
    } else {
      const text = await res.text();
      diagnostics.connection.status = 'FAILED_API_ERROR';
      diagnostics.connection.error = text;
    }
  } catch (err: any) {
    diagnostics.connection.status = 'CRASHED';
    diagnostics.connection.error = err.message || String(err);
  }

  return NextResponse.json(diagnostics);
}
