import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SimulationRecord } from '@/models/SimulationRecord';

// GET /api/grid/simulations — list simulation history (most recent first)
export async function GET() {
  try {
    await dbConnect();
    const records = await SimulationRecord.find().sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/grid/simulations — save a new simulation record
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const record = await SimulationRecord.create({
      simId: body.simId || body.id,
      scenario: body.scenario,
      date: body.date,
      stability: body.stability,
      outcome: body.outcome,
      params: body.params || null,
      results: body.results || null,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/grid/simulations — delete a simulation by simId (body: { simId })
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { simId } = await request.json();
    await SimulationRecord.findOneAndDelete({ simId });
    return NextResponse.json({ deleted: simId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
