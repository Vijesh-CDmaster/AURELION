import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Alert } from '@/models/Alert';

// GET /api/grid/alerts — list all alerts (most recent first)
export async function GET() {
  try {
    await dbConnect();
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/alerts — create a new alert
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const alert = await Alert.create({
      alertId: body.alertId || body.id || Math.random().toString(36).substr(2, 9),
      time: body.time,
      type: body.type,
      severity: body.severity,
      message: body.message,
      status: body.status || 'active',
    });
    return NextResponse.json(alert, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/grid/alerts — resolve an alert by alertId (body: { alertId })
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { alertId } = await request.json();
    const alert = await Alert.findOneAndUpdate(
      { alertId },
      { status: 'resolved' },
      { new: true }
    ).lean();
    return NextResponse.json(alert);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
