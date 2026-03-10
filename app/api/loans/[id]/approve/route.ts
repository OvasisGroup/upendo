import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { updateLoanStatusIfApproved } from '@/lib/loans'

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
    // Owner can mark all required roles at once
    const roles: Array<'CHAIRMAN'|'SECRETARY'|'TREASURER'> = ['CHAIRMAN','SECRETARY','TREASURER']
    for (const role of roles) {
      const existing = await prisma.loanApproval.findFirst({ where: { loanId: id, role: role as any } })
      if (existing) {
        await prisma.loanApproval.update({ where: { id: existing.id }, data: { status: decision as any, approverId: session.id } })
      } else {
        await prisma.loanApproval.create({ data: { loanId: id, role: role as any, status: decision as any, approverId: session.id } })
      }
    }
  } else {
    const existing = await prisma.loanApproval.findFirst({ where: { loanId: id, role: session.role as any } })
    if (existing) {
      await prisma.loanApproval.update({ where: { id: existing.id }, data: { status: decision as any, approverId: session.id } })
    } else {
      await prisma.loanApproval.create({ data: { loanId: id, role: session.role as any, status: decision as any, approverId: session.id } })
    }
  }

  await updateLoanStatusIfApproved(id)

  const loan = await prisma.loan.findUnique({ where: { id }, include: { approvals: true } })
  return NextResponse.json({ loan })
}
