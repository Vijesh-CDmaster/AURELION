/**
 * POST /api/training        — Save a training snapshot
 * GET  /api/training        — Load the latest training snapshot
 * GET  /api/training?list=1 — List snapshot summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TrainingSnapshot } from '@/models/TrainingSnapshot';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // List mode
    if (searchParams.get('list')) {
      const snapshots = await TrainingSnapshot.find({}, {
        snapshotId: 1, episodeCount: 1, avgReward: 1,
        convergenceRate: 1, createdAt: 1, 'hyperparams': 1,
        'qTableStats': 1, frequencyTrackingError: 1,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return NextResponse.json({ ok: true, snapshots });
    }

    // Specific snapshot by id
    const id = searchParams.get('id');
    if (id) {
      const snap = await TrainingSnapshot.findOne({ snapshotId: id }).lean();
      if (!snap) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, snapshot: snap });
    }

    // Latest snapshot
    const latest = await TrainingSnapshot.findOne().sort({ createdAt: -1 }).lean();
    if (!latest) return NextResponse.json({ ok: true, snapshot: null });
    return NextResponse.json({ ok: true, snapshot: latest });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/training GET]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Upsert by snapshotId so repeated saves overwrite
    const result = await TrainingSnapshot.findOneAndUpdate(
      { snapshotId: body.snapshotId },
      { $set: body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true, id: result.snapshotId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/training POST]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
