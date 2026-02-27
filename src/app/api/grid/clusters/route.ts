import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AgentCluster } from '@/models/AgentCluster';

// GET /api/grid/clusters — list all agent clusters
export async function GET() {
  try {
    await dbConnect();
    const clusters = await AgentCluster.find().lean();
    return NextResponse.json(clusters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/clusters — create or bulk-upsert clusters
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (Array.isArray(body)) {
      const ops = body.map((c: any) => ({
        updateOne: {
          filter: { name: c.name },
          update: { $set: c },
          upsert: true,
        },
      }));
      await AgentCluster.bulkWrite(ops);
      const clusters = await AgentCluster.find().lean();
      return NextResponse.json(clusters);
    } else {
      const cluster = await AgentCluster.findOneAndUpdate(
        { name: body.name },
        { $set: body },
        { new: true, upsert: true }
      ).lean();
      return NextResponse.json(cluster);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
