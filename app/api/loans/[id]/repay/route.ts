import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ amount: z.number().positive() })

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { amount } = schema.parse(await req.json())

  const { id } = await context.params
  const loan = await prisma.loan.findUnique({ where: { id }, include: { schedule: { orderBy: { installmentNo: 'asc' } }, repayments: true } })
  if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let remaining = amount
  for (const inst of loan.schedule) {
    if (remaining <= 0) break
    if (inst.isPaid) continue
    const due = inst.totalDue
    if (remaining >= due) {
      await prisma.repaymentSchedule.update({ where: { id: inst.id }, data: { isPaid: true } })
      remaining -= due
    } else {
      // Partial payment: mark when fully paid in later calls; keep it simple
      break
    }
  }

  const lastSchedule = await prisma.repaymentSchedule.findMany({ where: { loanId: loan.id } })
  const outstanding = lastSchedule.filter(s => !s.isPaid).reduce((acc, s) => acc + s.totalDue, 0)

  const repayment = await prisma.repayment.create({
    data: {
      loanId: loan.id,
      amountPaid: amount,
      balanceAfter: Math.max(0, Math.round(outstanding * 100) / 100),
      paymentDate: new Date()
    }
  })

  if (outstanding <= 0.01) {
    await prisma.loan.update({ where: { id: loan.id }, data: { status: 'COMPLETED' } })
  }

  return NextResponse.json({ repayment })
}
