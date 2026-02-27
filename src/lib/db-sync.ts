/**
 * DB Sync — client-side helper that talks to the API routes.
 *
 * All calls are fire-and-forget (non-blocking) so they don't slow down the
 * 2-second tick loop.  Failures are logged but never crash the UI.
 */

const SAVE_INTERVAL = parseInt(process.env.NEXT_PUBLIC_DB_SAVE_INTERVAL || '50', 10);

let _tickCounter = 0;
let _pendingAlerts: Record<string, unknown>[] = [];
let _pendingMetrics: Record<string, unknown>[] = [];
let _saving = false;

// ── Public helpers ───────────────────────────────────────────────────

/** Call every tick. Automatically batches and flushes at the configured interval. */
export function dbTickHook(payload: {
  tickNumber: number;
  // Snapshot data (only serialized when it's time to flush)
  getSnapshot: () => {
    snapshotId: string;
    episodeCount: number;
    avgReward: number;
    convergenceRate: number;
    frequencyTrackingError: number;
    qTableStats: { avgQ: number; maxQ: number; minQ: number; nonZeroPercent: number };
    hyperparams: { learningRate: number; discountFactor: number; epsilonDecay: number; minEpsilon: number };
    agents: unknown[];
  };
  // Per-tick metric
  metric: Record<string, unknown>;
  // New alerts this tick
  newAlerts: Record<string, unknown>[];
}): void {
  _tickCounter++;
  _pendingMetrics.push(payload.metric);
  if (payload.newAlerts.length > 0) _pendingAlerts.push(...payload.newAlerts);

  if (_tickCounter >= SAVE_INTERVAL && !_saving) {
    _tickCounter = 0;
    flush(payload.getSnapshot);
  }
}

/** Force an immediate flush (e.g. on page unload or manual save) */
export function forceFlush(getSnapshot: () => {
  snapshotId: string; episodeCount: number; avgReward: number;
  convergenceRate: number; frequencyTrackingError: number;
  qTableStats: { avgQ: number; maxQ: number; minQ: number; nonZeroPercent: number };
  hyperparams: { learningRate: number; discountFactor: number; epsilonDecay: number; minEpsilon: number };
  agents: unknown[];
}): void {
  flush(getSnapshot);
}

/** Fetch the latest training snapshot from the server */
export async function loadLatestSnapshot(): Promise<{
  snapshot: {
    snapshotId: string;
    episodeCount: number;
    avgReward: number;
    convergenceRate: number;
    hyperparams: { learningRate: number; discountFactor: number; epsilonDecay: number; minEpsilon: number };
    agents: {
      agentId: string; clusterId: number; qTableBase64: string;
      epsilon: number; cumulativeReward: number; lastAction: number;
      lastState: number; totalLoad: number;
      devices: { type: string; ratedPower: number; currentPower: number; stateOfCharge: number; isControllable: boolean; comfortCost: number }[];
    }[];
  } | null;
}> {
  try {
    const res = await fetch('/api/training', { cache: 'no-store' });
    if (!res.ok) return { snapshot: null };
    const json = await res.json();
    return { snapshot: json.snapshot ?? null };
  } catch (err) {
    console.warn('[db-sync] Failed to load latest snapshot', err);
    return { snapshot: null };
  }
}

/** Fetch historical alerts from server */
export async function loadAlerts(page = 1, limit = 50): Promise<{ alerts: unknown[]; total: number }> {
  try {
    const res = await fetch(`/api/alerts?page=${page}&limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) return { alerts: [], total: 0 };
    const json = await res.json();
    return { alerts: json.alerts ?? [], total: json.total ?? 0 };
  } catch (err) {
    console.warn('[db-sync] Failed to load alerts', err);
    return { alerts: [], total: 0 };
  }
}

/** Fetch snapshot list (summaries only) */
export async function loadSnapshotList(): Promise<unknown[]> {
  try {
    const res = await fetch('/api/training?list=1', { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.snapshots ?? [];
  } catch (err) {
    console.warn('[db-sync] Failed to load snapshot list', err);
    return [];
  }
}

// ── Internal ─────────────────────────────────────────────────────────

async function flush(getSnapshot: () => {
  snapshotId: string; episodeCount: number; avgReward: number;
  convergenceRate: number; frequencyTrackingError: number;
  qTableStats: { avgQ: number; maxQ: number; minQ: number; nonZeroPercent: number };
  hyperparams: { learningRate: number; discountFactor: number; epsilonDecay: number; minEpsilon: number };
  agents: unknown[];
}): Promise<void> {
  _saving = true;
  const alerts = [..._pendingAlerts];
  const metrics = [..._pendingMetrics];
  _pendingAlerts = [];
  _pendingMetrics = [];

  try {
    const snapshot = getSnapshot();

    // Fire all three in parallel
    await Promise.allSettled([
      fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      }),
      alerts.length > 0
        ? fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alerts),
          })
        : Promise.resolve(),
      metrics.length > 0
        ? fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metrics),
          })
        : Promise.resolve(),
    ]);

    console.log(`[db-sync] Flushed: snapshot=${snapshot.snapshotId}, alerts=${alerts.length}, metrics=${metrics.length}`);
  } catch (err) {
    console.warn('[db-sync] Flush failed (non-fatal)', err);
  } finally {
    _saving = false;
  }
}
