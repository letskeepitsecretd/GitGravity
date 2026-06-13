import { NextRequest, NextResponse } from 'next/server';
import { deleteCardFromDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const success = await deleteCardFromDb(username);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete card from database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Successfully deleted card for @${username}` });
  } catch (error: any) {
    console.error('Delete card API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
