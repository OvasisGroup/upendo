import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['LOAN','SAVINGS']),
  interestRate: z.number().nonnegative(),
  repaymentPeriod: z.number().int().positive(),
  repaymentPercent: z.number().nonnegative(),
})

export async function GET() {
  const products = await prisma.product.findMany()
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (!session.isOwner && !['CHAIRMAN','TREASURER','ADMINISTRATOR'].includes(session.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const data = createSchema.parse(await req.json())
  const product = await prisma.product.create({ data: data as any })
  await audit(session.id, 'CREATE', 'Product', product.id)
  return NextResponse.json({ product })
}
