import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyPassword, createSession } from '@/lib/auth'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await verifyPassword(password, user.password)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    await createSession({ id: user.id, role: user.role as any, email: user.email, isOwner: (user as any).isOwner ?? false })
    return NextResponse.json({ id: user.id, role: user.role, email: user.email, isOwner: (user as any).isOwner ?? false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
