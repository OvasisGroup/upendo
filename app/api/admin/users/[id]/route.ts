import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  role: z.enum(['ADMINISTRATOR','CHAIRMAN','SECRETARY','TREASURER','MEMBER']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !session.isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId)
  const body = await req.json()
  const data = updateSchema.parse(body)

  const user = await prisma.user.update({ where: { id }, data })
  return NextResponse.json({ user })
}
