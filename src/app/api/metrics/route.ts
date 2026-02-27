/**
 * POST /api/metrics  — Batch insert simulation metrics
 * GET  /api/metrics  — Query historical metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SimulationMetric } from '@/models/SimulationMetric';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const since = searchParams.get('since'); // ISO date

    const filter: Record<string, unknown> = {};
    if (since) filter.createdAt = { $gte: new Date(since) };

    const metrics = await SimulationMetric.find(filter)
      .sort({ tick: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ ok: true, metrics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/metrics GET]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const docs: Array<Record<string, unknown>> = Array.isArray(body) ? body : body.metrics ?? [body];

    if (docs.length === 0) return NextResponse.json({ ok: true, inserted: 0 });

    const result = await SimulationMetric.insertMany(docs, { ordered: false });
    return NextResponse.json({ ok: true, inserted: result.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/metrics POST]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
