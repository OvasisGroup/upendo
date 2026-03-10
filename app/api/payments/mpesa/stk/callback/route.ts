import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // Simulated callback: Accepts JSON with reference and success flag
  const body = await req.json()
  const { reference, success, raw } = body
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })
  const tx = await prisma.paymentTransaction.update({ where: { reference }, data: { status: success ? 'SUCCESS' as any : 'FAILED' as any, rawResponse: raw ?? body } })
  return NextResponse.json({ transaction: tx })
}
