import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { GridConfig } from '@/models/GridConfig';

// GET /api/grid/config — load the singleton config
export async function GET() {
  try {
    await dbConnect();
    let config = await GridConfig.findById('default').lean();
    if (!config) {
      // Create default config if none exists
      config = await GridConfig.create({ _id: 'default' });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/grid/config — update configuration fields
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const config = await GridConfig.findByIdAndUpdate(
      'default',
      { ...body, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
