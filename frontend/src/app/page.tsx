'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import ComparisonTable from '@/components/ComparisonTable';
import { search } from '@/lib/api';
import type { GroupedResult } from '@/types';

const EXAMPLE_SEARCHES = ['Paneer Burger', 'Chicken Biryani', "Domino's Pizza", 'Masala Dosa', 'Butter Naan'];

export default function Home() {
  const [results, setResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const handleSearch = useCallback(async (query: string, city: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await search(query, city || undefined);
      setResults(data.results);
      setFromCache(data.fromCache);
      setSearched(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      {!searched && (
        <div className="mb-10 text-center">
          <div className="mb-4 text-5xl">🍜</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Compare Food Delivery Prices
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Search once. Compare Swiggy, Zomato & more. Order from the best deal.
          </p>
        </div>
      )}

      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Example chips */}
      {!searched && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-xs text-gray-400">Try:</span>
          {EXAMPLE_SEARCHES.map(q => (
            <button
              key={q}
              onClick={() => handleSearch(q, '')}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-600 transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {searched && !loading && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {results.length} result{results.length !== 1 ? 's' : ''}
            {fromCache && <span className="ml-2 text-xs text-gray-400">(cached)</span>}
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-sm">Comparing prices across platforms…</p>
        </div>
      )}

      {!loading && <ComparisonTable results={results} />}
    </div>
  );
}
