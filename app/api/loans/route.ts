import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { ensureApprovalRecords, generateAmortization } from '@/lib/loans'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role === 'MEMBER') {
    const member = await prisma.member.findFirst({ where: { userId: session.id } })
    const loans = await prisma.loan.findMany({ where: { memberId: member?.id }, include: { approvals: true, schedule: true, repayments: true } })
    return NextResponse.json({ loans })
  }

  const loans = await prisma.loan.findMany({ include: { member: true, approvals: true, schedule: true } })
  return NextResponse.json({ loans })
}

const createSchema = z.object({
  memberId: z.string().optional(),
  productId: z.string(),
  principal: z.number().positive(),
  interestRate: z.number().positive(),
  repaymentPeriod: z.number().int().positive(),
  repaymentPct: z.number().positive()
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const data = createSchema.parse(body)

  let memberId = data.memberId
  if (session.role === 'MEMBER') {
    const member = await prisma.member.findFirst({ where: { userId: session.id } })
    if (!member) return NextResponse.json({ error: 'Member profile not found' }, { status: 400 })
    memberId = member.id
  } else if (!memberId) {
    return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  }

  const loan = await prisma.loan.create({
    data: {
      memberId: memberId!,
      productId: data.productId,
      principal: data.principal,
      interestRate: data.interestRate,
      repaymentPct: data.repaymentPct,
      status: 'DRAFT'
    }
  })

  await ensureApprovalRecords(loan.id)

  const schedule = generateAmortization(data.principal, data.interestRate, data.repaymentPeriod)
  await prisma.repaymentSchedule.createMany({
    data: schedule.map(s => ({ ...s, loanId: loan.id }))
  })

  const withSchedule = await prisma.loan.findUnique({ where: { id: loan.id }, include: { schedule: true, approvals: true } })
  return NextResponse.json({ loan: withSchedule })
}
