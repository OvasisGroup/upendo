import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/audit'

const schema = z.object({
  entity: z.string().default('LOAN'),
  requiredRoles: z.array(z.enum(['CHAIRMAN','SECRETARY','TREASURER','ADMINISTRATOR','MEMBER'])).min(1),
  minApprovals: z.number().int().positive()
})

export async function GET() {
  const q = await prisma.approvalQuorum.findFirst({ where: { entity: 'LOAN' } })
  return NextResponse.json({ quorum: q })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !session.isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = schema.parse(await req.json())
  const upsert = await prisma.approvalQuorum.upsert({
    where: { id: (await prisma.approvalQuorum.findFirst({ where: { entity: data.entity } }))?.id || '' },
    update: { requiredRoles: data.requiredRoles as any, minApprovals: data.minApprovals },
    create: { entity: data.entity, requiredRoles: data.requiredRoles as any, minApprovals: data.minApprovals }
  })
  await audit(session.id, 'UPSERT', 'ApprovalQuorum', upsert.id)
  return NextResponse.json({ quorum: upsert })
}
