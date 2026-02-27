import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Device } from '@/models/Device';

// GET /api/grid/devices — list all devices
export async function GET() {
  try {
    await dbConnect();
    const devices = await Device.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/devices — create or bulk-upsert devices
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk upsert
      const ops = body.map((d: any) => ({
        updateOne: {
          filter: { deviceId: d.deviceId || d.id },
          update: {
            $set: {
              deviceId: d.deviceId || d.id,
              type: d.type,
              status: d.status,
              load: d.load,
              cluster: d.cluster,
              latency: d.latency,
            },
          },
          upsert: true,
        },
      }));
      await Device.bulkWrite(ops);
      const devices = await Device.find().lean();
      return NextResponse.json(devices);
    } else {
      const device = await Device.findOneAndUpdate(
        { deviceId: body.deviceId || body.id },
        { $set: body },
        { new: true, upsert: true }
      ).lean();
      return NextResponse.json(device);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
