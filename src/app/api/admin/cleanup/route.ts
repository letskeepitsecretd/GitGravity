import { NextResponse } from 'next/server';
import { getCardsFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)?.replace(/\/$/, '');
  const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return NextResponse.json({ error: 'Missing KV credentials' }, { status: 500 });
  }

  try {
    const cards = await getCardsFromDb();
    
    // Filter out cards that contain the green box image URL or the username testuser
    const cleanedCards = cards.filter(c => {
      const isGreenBox = c.url.includes('3umu8k.png') || c.username === 'testuser';
      return !isGreenBox;
    });

    // Write cleaned array back to Upstash Redis
    const response = await fetch(`${KV_URL}/set/gitgravity:cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(cleanedCards),
    });

    if (!response.ok) {
      throw new Error(`Failed to write cleaned cards: ${response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      originalCount: cards.length,
      newCount: cleanedCards.length,
      removed: cards.filter(c => c.url.includes('3umu8k.png') || c.username === 'testuser').map(c => c.username),
      cards: cleanedCards.map(c => c.username)
    });
  } catch (error: any) {
    console.error("Cleanup API failed:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
