import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveCardToDb } from '@/lib/db';

async function uploadToCatbox(base64Data: string, username: string): Promise<string | null> {
  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="gitgravity-${username}.png"\r\nContent-Type: image/png\r\n\r\n`
    ];
    
    const part1Buffer = Buffer.from(parts[0], 'utf-8');
    const part2Buffer = Buffer.from(parts[1], 'utf-8');
    const endBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    
    const bodyBuffer = Buffer.concat([
      part1Buffer,
      part2Buffer,
      buffer,
      endBuffer
    ]);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      body: bodyBuffer
    });

    if (!res.ok) {
      console.warn("Catbox server response status:", res.status);
      return null;
    }
    const text = await res.text();
    if (text && text.startsWith('https://')) return text.trim();
    console.warn("Catbox response text was invalid:", text);
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
    const rawData = body.imageString || body.base64Data || body.image;
    const styleObj = body.style || {};
    const era = body.era || styleObj.era;
    const pattern = body.pattern || styleObj.pattern;
    const accent = body.accent || styleObj.accent;

    if (!username || !rawData) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // 1. Check if URL was already uploaded client-side, otherwise upload to Catbox
    let url = body.url;
    if (!url) {
      url = await uploadToCatbox(rawData, username);
    }

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

    // 2.5. Fallback: If both Catbox upload and local filesystem write failed, store the raw base64 data URL directly
    if (!url && rawData && rawData.startsWith('data:')) {
      console.log("Saving raw base64 data URL directly to database fallback...");
      url = rawData;
    }

    if (!url) {
      return NextResponse.json({ success: false, message: 'Could not store image' }, { status: 500 });
    }

    // 3. Save persistently to Vercel KV
    await saveCardToDb({
      username,
      style: {
        era: era || 'ERA_CLASSIC',
        pattern: pattern || 'SOLID',
        accent: accent || '#1ed760',
      },
      url
    });

    return NextResponse.json({ success: true, message: 'Card archived successfully', url });
  } catch (error) {
    console.error('Failed to save card:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
