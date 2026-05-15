'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getFavorites, removeFavorite } from '@/lib/api';
import type { FavouriteItem } from '@/types';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavouriteItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      getFavorites()
        .then(setFavorites)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  async function handleRemove(id: string) {
    await removeFavorite(id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  }

  if (loading || fetching) {
    return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="card py-20 text-center text-gray-400">
          <p className="text-4xl">❤️</p>
          <p className="mt-3 text-sm">No favorites yet. Save items from search results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map(fav => (
            <div key={fav.id} className="card flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{fav.restaurants.name}</p>
                {fav.menu_items && (
                  <p className="text-sm text-gray-500">{fav.menu_items.name}</p>
                )}
                <p className="text-xs text-gray-400">{fav.restaurants.city}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/?q=${encodeURIComponent(fav.menu_items?.name ?? fav.restaurants.name)}`)}
                  className="btn-secondary text-xs"
                >
                  Search again
                </button>
                <button
                  onClick={() => handleRemove(fav.id)}
                  className="rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
