/**
 * useAI — React hook for fetching Claude AI insights from FastAPI.
 * Provides loading state, auto-refresh, and manual refresh.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fastapi, AiResponse } from '@/lib/fastapi';

type AiFetcher = () => Promise<AiResponse>;

interface UseAIOptions {
  /** Function that calls the AI endpoint */
  fetcher: AiFetcher;
  /** Auto-refresh interval in ms (default: 30000 = 30s). Set 0 to disable. */
  refreshInterval?: number;
  /** Fetch immediately on mount (default: true) */
  immediate?: boolean;
}

interface UseAIReturn {
  /** AI insight text */
  insight: string;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => void;
}

export function useAI({
  fetcher,
  refreshInterval = 30000,
  immediate = true,
}: UseAIOptions): UseAIReturn {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      setInsight(res.insight || '');
    } catch (err: any) {
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) doFetch();

    if (refreshInterval > 0) {
      const interval = setInterval(doFetch, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [doFetch, immediate, refreshInterval]);

  return { insight, loading, error, refresh: doFetch };
}
