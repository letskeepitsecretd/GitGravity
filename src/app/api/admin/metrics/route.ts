import { NextResponse } from 'next/server';
import { getCardsFromDb } from '@/lib/db';

// Force Next.js to pull fresh data on every dashboard load/refresh
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch live registered metadata arrays from your cloud cluster
    const cards = await getCardsFromDb();

    // 2. Format data to feed the UI metrics dashboard slots directly
    return NextResponse.json({
      connections: 1420, // Static mock client vector
      queue: 12,        // Static mock compilation queue
      load: '42%',      // Static mock compute capacity matching your UI
      issued: cards.length, // Dynamic count of your cloud archive database entries
      cards: cards.map(card => ({
        id: card.timestamp ? `node-${card.timestamp}` : 'legacy-node',
        username: card.username || 'unknown_vector',
        url: card.url || ''
      }))
    });
    
  } catch (error) {
    console.error("❌ Failed to stream cloud metrics to superadmin pipeline:", error);
    return NextResponse.json({ error: 'Metrics transmission failure' }, { status: 500 });
  }
}
