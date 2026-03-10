import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hashPassword } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { ensureMemberApprovalRecords } from '@/lib/members'

const createSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  fullName: z.string().min(2),
  nationalId: z.string().min(4),
  phone: z.string().min(7),
  clusterId: z.string().optional()
})

export async function GET() {
  try {
    const members = await prisma.member.findMany({ include: { user: true, cluster: true } })
    return NextResponse.json({ members })
  } catch (e) {
    // Fallback for legacy client (branch relation) if migration/client not yet applied
    const legacy = await (prisma as any).member.findMany({ include: { user: true, branch: true } })
    const mapped = legacy.map((m: any) => ({
      ...m,
      cluster: m.branch ? { name: m.branch.name, region: m.branch.code ?? undefined } : null,
    }))
    return NextResponse.json({ members: mapped })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (!session.isOwner && !['ADMINISTRATOR','CHAIRMAN','SECRETARY','TREASURER'].includes(session.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const wantsAccount = Boolean(data.email) || Boolean(data.password)
  if (wantsAccount && !(data.email && data.password)) {
    return NextResponse.json({ error: 'Provide both email and password to create an account' }, { status: 400 })
  }
  let user: any = null
  if (data.email && data.password) {
    const hashed = await hashPassword(data.password)
    user = await prisma.user.create({ data: { email: data.email, password: hashed, role: 'MEMBER', isActive: true } })
  }
  const member = await prisma.member.create({ data: {
    ...(user ? { userId: user.id } : {}),
    fullName: data.fullName,
    nationalId: data.nationalId,
    phone: data.phone,
    clusterId: data.clusterId,
    status: 'PENDING'
  } })
  await ensureMemberApprovalRecords(member.id)
  await audit(session.id, 'CREATE', 'Member', member.id)
  return NextResponse.json({ member, user })
}
