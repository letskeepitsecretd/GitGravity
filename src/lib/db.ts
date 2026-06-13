import { promises as fs } from 'fs';
import path from 'path';

// Force Next.js to always execute this fresh at runtime
export const dynamic = 'force-dynamic';

const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)?.replace(/\/$/, '');
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'scratch', 'cards_db.json');

// Helper to check if we are in production with valid cloud credentials
const isCloudConfigured = (): boolean => {
  return typeof window === 'undefined' && !!KV_URL && !!KV_TOKEN;
};

export interface CardMetadata {
  username: string;
  style: {
    era: string;
    pattern: string;
    accent: string;
  };
  url: string;
  timestamp: number;
}

/**
 * Safely fetches all card arrays from Vercel KV or local disk fallback
 */
export async function getCardsFromDb(): Promise<CardMetadata[]> {
  if (isCloudConfigured()) {
    try {
      const response = await fetch(`${KV_URL}/get/gitgravity:cards`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        cache: 'no-store', // Prevent fetch-level caching
      });
      
      if (!response.ok) throw new Error(`KV Read Error: ${response.statusText}`);
      const data = await response.json();
      
      // Upstash/Vercel KV returns the value inside a 'result' field
      if (data && data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
      return [];
    } catch (error) {
      console.error('❌ Cloud DB read pipeline failed:', error);
      return [];
    }
  }

  // Local Development Fallback Layer
  try {
    await fs.mkdir(path.dirname(LOCAL_STORAGE_PATH), { recursive: true });
    const fileData = await fs.readFile(LOCAL_STORAGE_PATH, 'utf-8');
    return JSON.parse(fileData);
  } catch {
    return [];
  }
}

/**
 * Explicitly stringifies data payloads and registers them directly to the cloud cluster
 */
export async function saveCardToDb(newCard: Omit<CardMetadata, 'timestamp'>): Promise<boolean> {
  const currentCards = await getCardsFromDb();
  
  // Prevent duplicate cards for the same user in the registry array
  const filteredCards = currentCards.filter(card => card.username.toLowerCase() !== newCard.username.toLowerCase());
  
  const updatedCards: CardMetadata[] = [
    { ...newCard, timestamp: Date.now() },
    ...filteredCards
  ];

  if (isCloudConfigured()) {
    try {
      // The REST endpoint requires explicitly stringified structural arrays passed as text/plain
      const response = await fetch(`${KV_URL}/set/gitgravity:cards`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'text/plain', 
        },
        body: JSON.stringify(updatedCards),
      });

      if (!response.ok) throw new Error(`KV Write Error: ${response.statusText}`);
      return true;
    } catch (error) {
      console.error('❌ Cloud DB write pipeline stalled:', error);
      return false;
    }
  }

  // Local Development Fallback Write Layer
  try {
    await fs.mkdir(path.dirname(LOCAL_STORAGE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(updatedCards, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('❌ Local file system fallback write execution crashed:', error);
    return false;
  }
}
