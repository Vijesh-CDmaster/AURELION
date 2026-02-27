/**
 * POST /api/alerts  — Batch upsert alerts
 * GET  /api/alerts  — Paginated alert history
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AlertLog } from '@/models/AlertLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const type = searchParams.get('type');

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;

    const [alerts, total] = await Promise.all([
      AlertLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AlertLog.countDocuments(filter),
    ]);

    return NextResponse.json({ ok: true, alerts, total, page, limit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/alerts GET]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const alerts: Array<Record<string, unknown>> = Array.isArray(body) ? body : body.alerts ?? [body];

    if (alerts.length === 0) return NextResponse.json({ ok: true, inserted: 0 });

    // Bulk upsert by alertId
    const ops = alerts.map((a) => ({
      updateOne: {
        filter: { alertId: a.alertId },
        update: { $set: a },
        upsert: true,
      },
    }));
    const result = await AlertLog.bulkWrite(ops);

    return NextResponse.json({ ok: true, upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/alerts POST]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
