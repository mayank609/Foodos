'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import SearchBar from '@/components/SearchBar';
import ComparisonTable from '@/components/ComparisonTable';
import { search } from '@/lib/api';
import type { GroupedResult } from '@/types';

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQuery = params.get('q') ?? '';
  const initialCity = params.get('city') ?? '';

  const [results, setResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(query: string, city: string) {
    setLoading(true);
    setError('');
    const sp = new URLSearchParams();
    sp.set('q', query);
    if (city) sp.set('city', city);
    router.replace(`/search?${sp.toString()}`);

    try {
      const data = await search(query, city || undefined);
      setResults(data.results);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery, initialCity);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SearchBar onSearch={handleSearch} loading={loading} />
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        </div>
      ) : (
        <ComparisonTable results={results} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-gray-400">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
