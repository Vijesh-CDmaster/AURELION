import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { DefenseLog } from '@/models/DefenseLog';

// GET /api/grid/defense-log — list recent defense log entries
export async function GET() {
  try {
    await dbConnect();
    const logs = await DefenseLog.find().sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/defense-log — create a new defense log entry (or batch)
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (Array.isArray(body)) {
      const docs = await DefenseLog.insertMany(body);
      return NextResponse.json(docs, { status: 201 });
    } else {
      const doc = await DefenseLog.create(body);
      return NextResponse.json(doc, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
