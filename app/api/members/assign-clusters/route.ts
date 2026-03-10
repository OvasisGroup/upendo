import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function POST() {
  const session = await getSession()
  if (!session || (!session.isOwner && !['ADMINISTRATOR','CHAIRMAN'].includes(session.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clusters = await prisma.cluster.findMany({ select: { id: true } })
  if (clusters.length === 0) {
    return NextResponse.json({ error: 'No clusters available' }, { status: 400 })
  }

  // Members without an assigned cluster
  let unassigned: { id: string }[] = []
  try {
    unassigned = await prisma.member.findMany({ where: { OR: [{ clusterId: null as any }] }, select: { id: true } })
  } catch {
    // If clusterId is non-nullable in schema, there won't be unassigned members
    unassigned = []
  }

  if (unassigned.length === 0) {
    return NextResponse.json({ assigned: 0, totalClusters: clusters.length, message: 'No unassigned members found' })
  }

  const updates = unassigned.map((m) => {
    const pick = clusters[Math.floor(Math.random() * clusters.length)]
    return prisma.member.update({ where: { id: m.id }, data: { clusterId: pick.id } })
  })

  const results = await prisma.$transaction(updates)
  try { await audit(session.id, 'BULK_ASSIGN', 'Member.clusterId', 'RANDOM') } catch {}
  return NextResponse.json({ assigned: results.length, totalClusters: clusters.length })
}
