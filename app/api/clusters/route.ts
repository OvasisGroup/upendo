import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

// Fields are optional and may be empty; server will store empty strings if omitted
const schema = z.object({ name: z.string().optional(), region: z.string().optional() })

export async function GET() {
  try {
    const clusters = await prisma.cluster.findMany({ include: { sacco: true, _count: { select: { members: true } } } })
    return NextResponse.json({ clusters })
  } catch (e) {
    // Fallback for legacy Branch schema before migration completes
    try {
      const branches = await (prisma as any).branch.findMany?.({ include: { sacco: true } })
      if (Array.isArray(branches)) {
        const mapped = branches.map((b: any) => ({ id: b.id, name: b.name, region: b.code, sacco: b.sacco, _count: { members: 0 } }))
        return NextResponse.json({ clusters: mapped })
      }
    } catch {}
    return NextResponse.json({ clusters: [] })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (!session.isOwner && session.role !== 'CHAIRMAN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid input',
      details: parsed.error.flatten(),
    }, { status: 400 })
  }
  const saccoId = (session as any).saccoId
  let resolvedSaccoId = saccoId
  if (!resolvedSaccoId) {
    try {
      const sacco = await prisma.sacco.findFirst({ select: { id: true } })
      resolvedSaccoId = sacco?.id
    } catch {}
    if (!resolvedSaccoId) {
      return NextResponse.json({ error: 'Missing SACCO context (no SACCO found). Please create a SACCO first.' }, { status: 400 })
    }
  }
  try {
    const cluster = await prisma.cluster.create({ data: { saccoId: resolvedSaccoId, name: parsed.data.name ?? '', region: parsed.data.region ?? '' } })
    try { await audit(session.id, 'CREATE', 'Cluster', cluster.id) } catch {}
    return NextResponse.json({ cluster })
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Failed to create cluster'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
