import fs from 'fs';
import path from 'path';

export interface CardRecord {
  username: string;
  era: string;
  pattern: string;
  accent: string;
  timestamp: string;
  url: string; // Persistent hosted image URL (e.g. Catbox.moe)
  isPlaceholder?: boolean;
}

const LOCAL_DIR = path.join(process.cwd(), 'public/cards');
const MANIFEST_PATH = path.join(LOCAL_DIR, 'manifest.json');
const KV_KEY = 'gitgravity:cards';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Helper to determine if Vercel KV is configured
function isKvConfigured(): boolean {
  return !!(KV_URL && KV_TOKEN);
}

// Fetch all cards from KV or Local Filesystem
export async function getCardsFromDb(): Promise<CardRecord[]> {
  if (isKvConfigured()) {
    try {
      const response = await fetch(KV_URL!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', KV_KEY]),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.result) {
          const cards = JSON.parse(data.result);
          if (Array.isArray(cards)) {
            return cards;
          }
        }
      }
    } catch (e) {
      console.error('Vercel KV fetch failed, falling back to local:', e);
    }
  }

  // Local filesystem fallback
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
      const manifest = JSON.parse(manifestData);
      return manifest.map((item: any) => {
        let isPlaceholder = item.isPlaceholder;
        if (isPlaceholder === undefined) {
          try {
            const filepath = path.join(LOCAL_DIR, `${item.username}.png`);
            if (fs.existsSync(filepath)) {
              const stats = fs.statSync(filepath);
              isPlaceholder = stats.size < 1000; // Under 1KB is a placeholder
            } else {
              isPlaceholder = true; // No file exists
            }
          } catch (e) {
            isPlaceholder = false;
          }
        }
        return {
          ...item,
          url: item.url || `/cards/${item.username}.png`,
          isPlaceholder
        };
      });
    }
  } catch (e) {
    console.error('Failed to read local manifest:', e);
  }

  // Fallback: search directory for pngs if manifest is missing
  try {
    if (fs.existsSync(LOCAL_DIR)) {
      const files = fs.readdirSync(LOCAL_DIR).filter(file => file.endsWith('.png'));
      return files.map(file => {
        const username = file.split('.')[0];
        return {
          username,
          era: 'ERA_CLASSIC',
          pattern: 'SOLID',
          accent: '#1ed760',
          timestamp: new Date().toISOString(),
          url: `/cards/${file}`
        };
      });
    }
  } catch (e) {
    console.error('Failed to scan local cards directory:', e);
  }

  return [];
}

// Save a card to KV or Local Filesystem
export async function saveCardToDb(card: Omit<CardRecord, 'timestamp'>): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const record: CardRecord = { ...card, timestamp };

  if (isKvConfigured()) {
    try {
      // 1. Get existing cards
      const cards = await getCardsFromDb();

      // 2. Filter out duplicates for the same username
      const filtered = cards.filter(c => c.username.toLowerCase() !== card.username.toLowerCase());

      // 3. Append the new record at the top
      filtered.unshift(record);

      // 4. Save back to KV
      const response = await fetch(KV_URL!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', KV_KEY, JSON.stringify(filtered)]),
      });

      if (response.ok) {
        console.log('Saved card metadata to Vercel KV persistently.');
        return true;
      }
    } catch (e) {
      console.error('Failed to write to Vercel KV:', e);
    }
  }

  // Local filesystem fallback (useful for local development)
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }

    let manifest: any[] = [];
    if (fs.existsSync(MANIFEST_PATH)) {
      try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      } catch (e) {
        console.error('Failed to parse manifest.json, resetting', e);
      }
    }

    manifest = manifest.filter(item => item.username.toLowerCase() !== card.username.toLowerCase());
    manifest.unshift(record);

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Saved card metadata to local manifest.json.');
    return true;
  } catch (e) {
    console.error('Failed to write to local manifest:', e);
    return false;
  }
}
