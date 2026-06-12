import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Reads from public/cards directory
    const cardDir = path.join(process.cwd(), 'public/cards');
    let files: string[] = [];
    
    const cards = [];
    if (fs.existsSync(cardDir)) {
      const files = fs.readdirSync(cardDir).filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
      for (const file of files) {
        const filepath = path.join(cardDir, file);
        let isPlaceholder = false;
        try {
          const stats = fs.statSync(filepath);
          isPlaceholder = stats.size < 500;
        } catch (e) {
          console.warn("Failed to check stat of:", file, e);
        }
        cards.push({
          id: file,
          username: file.split('.')[0],
          url: `/cards/${file}`,
          isPlaceholder
        });
      }
    }

    return NextResponse.json({
      connections: 1420,
      queue: 12,
      load: '42%',
      issued: cards.length,
      cards
    });
  } catch (error) {
    return NextResponse.json({ error: 'System unreachable' }, { status: 500 });
  }
}
