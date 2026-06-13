import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCardsFromDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) {
      return new Response('Username is required', { status: 400 });
    }

    const safeUsername = username.replace(/[^a-zA-Z0-9-_]/g, '');

    // 1. Check database for a cloud-hosted URL (Catbox)
    const cards = await getCardsFromDb();
    const card = cards.find(c => c.username.toLowerCase() === safeUsername.toLowerCase());
    
    if (card && card.url && card.url.startsWith('http')) {
      try {
        const imgRes = await fetch(card.url);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          return new Response(Buffer.from(arrayBuffer), {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
            },
          });
        }
      } catch (fetchErr) {
        console.error('Failed to proxy cloud image:', fetchErr);
      }
    }

    // 2. Fall back to local file system
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
