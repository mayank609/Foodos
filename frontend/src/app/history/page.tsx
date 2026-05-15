'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getHistory } from '@/lib/api';
import type { HistoryItem } from '@/types';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      getHistory()
        .then(setHistory)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Search History</h1>

      {history.length === 0 ? (
        <div className="card py-20 text-center text-gray-400">
          <p className="text-4xl">🕐</p>
          <p className="mt-3 text-sm">No searches yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {history.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}${item.city ? `&city=${item.city}` : ''}`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-300">🔍</span>
                <div>
                  <p className="font-medium text-slate-900">{item.query}</p>
                  {item.city && <p className="text-xs text-gray-400 capitalize">{item.city}</p>}
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(item.searched_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
