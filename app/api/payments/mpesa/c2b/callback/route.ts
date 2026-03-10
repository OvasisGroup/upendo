import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // Simulated C2B callback: Save full payload
  const body = await req.json()
  const tx = await prisma.paymentTransaction.create({ data: {
    memberId: body.memberId ?? 'unknown',
    loanId: body.loanId,
    amount: Number(body.amount) || 0,
    method: 'MPESA' as any,
    reference: body.reference || `C2B-${Date.now()}`,
    status: (body.success ? 'SUCCESS' : 'FAILED') as any,
    rawResponse: body
  } })
  return NextResponse.json({ transaction: tx })
}
