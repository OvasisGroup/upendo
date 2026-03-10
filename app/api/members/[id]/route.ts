import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idRaw = typeof id === 'string' ? decodeURIComponent(id).trim() : ''
  if (!idRaw) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let member = await prisma.member.findUnique({
    where: { id: idRaw },
    include: { user: true, cluster: true, loans: true }
  })
  if (!member) {
    member = await prisma.member.findUnique({
      where: { nationalId: idRaw },
      include: { user: true, cluster: true, loans: true }
    })
  }

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ member })
}
