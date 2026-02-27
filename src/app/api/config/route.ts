/**
 * POST /api/config  — Save a config snapshot
 * GET  /api/config  — Load the latest config (or specific by id)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { GridConfig } from '@/models/GridConfig';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // List mode
    if (searchParams.get('list')) {
      const configs = await GridConfig.find({}, { label: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      return NextResponse.json({ ok: true, configs });
    }

    // Latest config
    const latest = await GridConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!latest) return NextResponse.json({ ok: true, config: null });
    return NextResponse.json({ ok: true, config: latest });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/config GET]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const doc = await GridConfig.create(body);
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API/config POST]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
