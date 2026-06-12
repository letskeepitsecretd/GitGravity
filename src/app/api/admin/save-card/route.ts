import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username;
    const rawData = body.base64Data || body.image;
    const era = body.era;
    const pattern = body.pattern;
    const accent = body.accent;

    if (!username || !rawData) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const base64Image = rawData.replace(/^data:image\/\w+;base64,/, '');

    const dir = path.join(process.cwd(), 'public/cards');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save PNG image
    const filepath = path.join(dir, `${username}.png`);
    fs.writeFileSync(filepath, base64Image, 'base64');

    // Save DNA metadata inside manifest.json
    const manifestPath = path.join(dir, 'manifest.json');
    let manifest: any[] = [];
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse manifest.json, resetting', e);
      }
    }

    // Filter out old records for the same user to prevent duplicates
    manifest = manifest.filter(item => item.username !== username);

    // Append new record
    manifest.unshift({
      username,
      era: era || 'ERA_CLASSIC',
      pattern: pattern || 'SOLID',
      accent: accent || '#1ed760',
      timestamp: new Date().toISOString()
    });

    // Write back manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Card archived successfully with metadata' });
  } catch (error) {
    console.error('Failed to save card:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
