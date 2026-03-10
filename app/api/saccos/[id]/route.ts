import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const patchSchema = z.object({ name: z.string().min(2).optional(), code: z.string().min(2).optional() })

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const sacco = await prisma.sacco.findUnique({ where: { id }, include: { clusters: true } })
  if (!sacco) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ sacco })
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !session.isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await context.params
  const data = patchSchema.parse(await req.json())
  const sacco = await prisma.sacco.update({ where: { id }, data })
  await audit(session.id, 'UPDATE', 'Sacco', id)
  return NextResponse.json({ sacco })
}
