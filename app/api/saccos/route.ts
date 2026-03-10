import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const schema = z.object({ name: z.string().min(2), code: z.string().min(2) })

export async function GET() {
  const saccos = await prisma.sacco.findMany({ include: { branches: true } })
  return NextResponse.json({ saccos })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (!session.isOwner && session.role !== 'CHAIRMAN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const data = schema.parse(await req.json())
  const sacco = await prisma.sacco.create({ data })
  await audit(session.id, 'CREATE', 'Sacco', sacco.id)
  return NextResponse.json({ sacco })
}
