import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveCardToDb } from '@/lib/db';

async function uploadToCatbox(base64Data: string, username: string): Promise<string | null> {
  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('fileToUpload', blob, `gitgravity-${username}.png`);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) return null;
    const text = await res.text();
    if (text && text.startsWith('https://')) return text.trim();
    return null;
  } catch (e) {
    console.warn("Backend Catbox upload failed:", e);
    return null;
  }
}

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

    // 1. Upload to Catbox for persistent cloud storage on Vercel
    let url = await uploadToCatbox(rawData, username);

    // 2. Local filesystem write fallback (always run locally, or as backup on serverless)
    try {
      const base64Image = rawData.replace(/^data:image\/\w+;base64,/, '');
      const dir = path.join(process.cwd(), 'public/cards');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filepath = path.join(dir, `${username}.png`);
      fs.writeFileSync(filepath, base64Image, 'base64');
      
      if (!url) {
        url = `/cards/${username}.png`;
      }
    } catch (fsErr) {
      console.warn("Local filesystem write skipped/failed (normal on Vercel serverless):", fsErr);
    }

    if (!url) {
      return NextResponse.json({ success: false, message: 'Could not store image' }, { status: 500 });
    }

    // 3. Save persistently to Vercel KV (falls back to local manifest.json automatically)
    await saveCardToDb({
      username,
      era: era || 'ERA_CLASSIC',
      pattern: pattern || 'SOLID',
      accent: accent || '#1ed760',
      url
    });

    return NextResponse.json({ success: true, message: 'Card archived successfully', url });
  } catch (error) {
    console.error('Failed to save card:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
