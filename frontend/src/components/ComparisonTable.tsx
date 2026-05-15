'use client';

import Image from 'next/image';
import { useState } from 'react';
import RecommendationBadge from './RecommendationBadge';
import { formatRupees, platformColor, cn } from '@/lib/utils';
import type { GroupedResult, PlatformResult, Recommendation } from '@/types';
import { addFavorite } from '@/lib/api';
import { useAuth } from './AuthProvider';

interface Props {
  results: GroupedResult[];
}

export default function ComparisonTable({ results }: Props) {
  if (!results.length) {
    return (
      <div className="card mt-8 py-20 text-center text-gray-400">
        <p className="text-4xl">🍽️</p>
        <p className="mt-3 text-sm">No results found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {results.map(result => (
        <ResultCard key={`${result.restaurantName}-${result.itemName}`} result={result} />
      ))}
    </div>
  );
}

function ResultCard({ result }: { result: GroupedResult }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const bestPlatform = result.platforms.find(
    p => p.platformSlug === result.recommendation.bestValue
  );

  async function handleSave() {
    if (!user || !bestPlatform) return;
    await addFavorite(bestPlatform.restaurantId, bestPlatform.itemId);
    setSaved(true);
  }

  return (
    <div className="card overflow-hidden">
      {/* Item header */}
      <div className="flex items-start gap-4 p-4">
        {result.imageUrl && (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
            <Image
              src={result.imageUrl}
              alt={result.itemName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{result.itemName}</h3>
            {result.isVeg != null && (
              <span className={cn(
                'text-xs font-medium',
                result.isVeg ? 'text-green-600' : 'text-red-600'
              )}>
                {result.isVeg ? '🟢 Veg' : '🔴 Non-veg'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{result.restaurantName}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.recommendation.bestValue && (
              <RecommendationBadge type="bestValue" />
            )}
            {result.recommendation.cheapest !== result.recommendation.bestValue && result.recommendation.cheapest && (
              <RecommendationBadge type="cheapest" />
            )}
            {result.recommendation.fastest && (
              <RecommendationBadge type="fastest" />
            )}
          </div>
        </div>
        {user && (
          <button
            onClick={handleSave}
            disabled={saved}
            className={cn(
              'flex-shrink-0 rounded-full p-2 transition',
              saved ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
            )}
            title="Save to favorites"
          >
            {saved ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      {/* Platform rows */}
      <div className="divide-y divide-gray-50 border-t border-gray-100">
        {result.platforms.map(platform => (
          <PlatformRow
            key={platform.platformSlug}
            platform={platform}
            recommendation={result.recommendation}
          />
        ))}
      </div>

      {/* Offers expansion */}
      {result.platforms.some(p => p.offers.length > 0) && (
        <div className="border-t border-gray-100 px-4 py-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            {expanded ? 'Hide offers ▲' : `Show offers ▼`}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {result.platforms.flatMap(p =>
                p.offers.map((o, i) => (
                  <div key={`${p.platformSlug}-${i}`} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className={cn('mt-0.5 rounded px-1.5 py-0.5 text-white text-[10px] font-bold', platformColor(p.platformSlug))}>
                      {p.platform}
                    </span>
                    <span>{o.title}{o.description ? ` — ${o.description}` : ''}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformRow({
  platform,
  recommendation,
}: {
  platform: PlatformResult;
  recommendation: Recommendation;
}) {
  const isBestValue = platform.platformSlug === recommendation.bestValue;
  const isCheapest = platform.platformSlug === recommendation.cheapest;
  const isFastest = platform.platformSlug === recommendation.fastest;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition',
        isBestValue && 'bg-purple-50/50'
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold', platformColor(platform.platformSlug))}>
          {platform.platform}
        </span>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>{formatRupees(platform.pricePaise)} item</span>
            <span>+</span>
            <span>{formatRupees(platform.deliveryFeePaise)} delivery</span>
            {platform.platformFeePaise > 0 && (
              <>
                <span>+</span>
                <span>{formatRupees(platform.platformFeePaise)} platform fee</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {platform.rating != null && <span>⭐ {platform.rating.toFixed(1)}</span>}
            {platform.etaMinutes != null && <span>🕐 {platform.etaMinutes} min</span>}
            <span className="text-[10px]">Updated {platform.dataFreshnessMinutes}m ago</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-base font-bold text-slate-900">{formatRupees(platform.totalPricePaise)}</div>
          <div className="flex gap-1">
            {isCheapest && <RecommendationBadge type="cheapest" />}
            {isFastest && <RecommendationBadge type="fastest" />}
          </div>
        </div>
        {platform.deepLink && (
          <a
            href={platform.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            Order →
          </a>
        )}
      </div>
    </div>
  );
}
