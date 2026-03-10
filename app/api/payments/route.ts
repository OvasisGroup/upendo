import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'

const schema = z.object({
  memberId: z.string(),
  loanId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(['MPESA','BANK','CASH']),
  reference: z.string().min(3)
})

export async function GET() {
  const tx = await prisma.paymentTransaction.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ transactions: tx })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = schema.parse(await req.json())
  const created = await prisma.paymentTransaction.create({ data: { ...data, status: 'SUCCESS' as any } })
  await audit(session.id, 'CREATE', 'PaymentTransaction', created.id)
  const member = await prisma.member.findUnique({ where: { id: data.memberId }, include: { user: true } })
  if (member?.user) await notify(member.user.id, 'Payment received', `Payment of ${data.amount} recorded`, 'IN_APP')
  return NextResponse.json({ transaction: created })
}
