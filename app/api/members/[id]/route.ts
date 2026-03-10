import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const idRaw = typeof params?.id === 'string' ? decodeURIComponent(params.id).trim() : ''
  if (!idRaw) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  let member = await prisma.member.findUnique({
    where: { id: idRaw },
    include: { user: true, branch: true, loans: true }
  })
  if (!member) {
    member = await prisma.member.findUnique({
      where: { nationalId: idRaw },
      include: { user: true, branch: true, loans: true }
    })
  }

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ member })
}
