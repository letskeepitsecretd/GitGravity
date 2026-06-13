import { NextResponse } from 'next/server';
import { getCardsFromDb } from '@/lib/db';

export async function GET() {
  try {
    const cards = await getCardsFromDb();
    
    // Sort cards to ensure newly created are shown first
    const sortedCards = [...cards].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      connections: 1420,
      queue: 12,
      load: '42%',
      issued: sortedCards.length,
      cards: sortedCards
    });
  } catch (error) {
    return NextResponse.json({ error: 'System unreachable' }, { status: 500 });
  }
}
