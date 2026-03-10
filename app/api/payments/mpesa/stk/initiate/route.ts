import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({ memberId: z.string(), loanId: z.string().optional(), amount: z.number().positive() })

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = schema.parse(await req.json())
  // Stub: Record INITIATED transaction; in real flow, call MPESA API and store raw request
  const tx = await prisma.paymentTransaction.create({ data: {
    memberId: data.memberId,
    loanId: data.loanId,
    amount: data.amount,
    method: 'MPESA' as any,
    reference: `STK-${Date.now()}`,
    status: 'INITIATED' as any,
    rawResponse: { note: 'Simulated STK initiation' } as any
  } })
  return NextResponse.json({ transaction: tx })
}
