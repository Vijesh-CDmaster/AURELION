import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { GridSnapshot } from '@/models/GridSnapshot';

// GET /api/grid/snapshots — get recent snapshots (for history page)
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const snapshots = await GridSnapshot.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    return NextResponse.json(snapshots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/snapshots — save a telemetry snapshot
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const snapshot = await GridSnapshot.create({
      timestamp: new Date(),
      ...body,
    });
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
