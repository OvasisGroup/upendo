import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { updateMemberStatusIfApproved } from '@/lib/members'

const schema = z.object({ decision: z.enum(['APPROVED','REJECTED']) })

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.isOwner && !['CHAIRMAN','SECRETARY','TREASURER'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { decision } = schema.parse(await req.json())
  const { id } = await context.params
  if (session.isOwner) {
    const roles: Array<'CHAIRMAN'|'SECRETARY'|'TREASURER'> = ['CHAIRMAN','SECRETARY','TREASURER']
    for (const role of roles) {
      const existing = await prisma.memberApproval.findFirst({ where: { memberId: id, role: role as any } })
      if (existing) {
        await prisma.memberApproval.update({ where: { id: existing.id }, data: { status: decision as any, approverId: session.id } })
      } else {
        await prisma.memberApproval.create({ data: { memberId: id, role: role as any, status: decision as any, approverId: session.id } })
      }
    }
  } else {
    const existing = await prisma.memberApproval.findFirst({ where: { memberId: id, role: session.role as any } })
    if (existing) {
      await prisma.memberApproval.update({ where: { id: existing.id }, data: { status: decision as any, approverId: session.id } })
    } else {
      await prisma.memberApproval.create({ data: { memberId: id, role: session.role as any, status: decision as any, approverId: session.id } })
    }
  }

  await updateMemberStatusIfApproved(id)

  const member = await prisma.member.findUnique({ where: { id }, include: { cluster: true } })
  const approvals = await prisma.memberApproval.findMany({ where: { memberId: id } })
  return NextResponse.json({ member, approvals })
}
