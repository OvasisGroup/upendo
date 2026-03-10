// Deprecated branches route; use /api/clusters instead
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Use /api/clusters' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Use /api/clusters' }, { status: 410 })
}
