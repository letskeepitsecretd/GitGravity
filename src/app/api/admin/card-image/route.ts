import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) {
      return new Response('Username is required', { status: 400 });
    }

    // Clean username to prevent path traversal
    const safeUsername = username.replace(/[^a-zA-Z0-9-_]/g, '');
    const filepath = path.join(process.cwd(), 'public/cards', `${safeUsername}.png`);

    if (!fs.existsSync(filepath)) {
      return new Response('Card not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filepath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Failed to load card image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
