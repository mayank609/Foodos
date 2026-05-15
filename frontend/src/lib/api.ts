import { getIdToken } from './firebase';
import type { SearchResponse, FavouriteItem, HistoryItem } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function search(query: string, city?: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ query });
  if (city) params.set('city', city);
  const res = await fetch(`${API}/api/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getFavorites(): Promise<FavouriteItem[]> {
  const res = await fetch(`${API}/api/favorites`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load favorites');
  return res.json();
}

export async function addFavorite(restaurantId: string, menuItemId?: string): Promise<void> {
  await fetch(`${API}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ restaurantId, menuItemId }),
  });
}

export async function removeFavorite(id: string): Promise<void> {
  await fetch(`${API}/api/favorites/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API}/api/history`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}
