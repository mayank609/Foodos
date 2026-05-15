'use client';

import { useState, useRef, useCallback } from 'react';

interface Props {
  onSearch: (query: string, city: string) => void;
  loading: boolean;
}

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.trim().length >= 2) {
        debounceRef.current = setTimeout(() => {
          onSearch(value.trim(), city);
        }, 400);
      }
    },
    [city, onSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) onSearch(query.trim(), city);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search for Paneer Burger, Biryani, Pizza…"
          value={query}
          onChange={e => handleChange(e.target.value)}
          className="input pl-9"
          autoFocus
        />
      </div>

      <select
        value={city}
        onChange={e => setCity(e.target.value)}
        className="input w-full sm:w-44"
      >
        <option value="">All cities</option>
        {CITIES.map(c => (
          <option key={c} value={c.toLowerCase()}>{c}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading || query.trim().length < 2}
        className="btn-primary whitespace-nowrap"
      >
        {loading ? 'Searching…' : 'Compare'}
      </button>
    </form>
  );
}
