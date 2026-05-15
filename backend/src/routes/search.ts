import { Router, Response } from 'express';
import { z } from 'zod';
import { getCached, setCache, searchCacheKey } from '../services/cache.js';
import { searchItems, saveSearchHistory } from '../services/database.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import type { SearchResult } from '../types/index.js';

const router = Router();

const SearchSchema = z.object({
  query: z.string().min(2).max(100).trim(),
  city: z.string().trim().optional(),
});

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const parsed = SearchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { query, city = null } = parsed.data;
  const cacheKey = searchCacheKey(query, city);

  const cached = await getCached<SearchResult>(cacheKey);
  if (cached) {
    res.json({ ...cached, fromCache: true });
    return;
  }

  const results = await searchItems(query, city);

  const response: SearchResult = {
    query,
    city,
    results,
    cachedAt: new Date().toISOString(),
  };

  await Promise.all([
    setCache(cacheKey, response),
    saveSearchHistory(req.userId ?? null, query, city, results.length),
  ]);

  res.json({ ...response, fromCache: false });
});

export default router;
