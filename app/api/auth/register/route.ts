import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['CHAIRMAN','SECRETARY','TREASURER','ADMINISTRATOR','MEMBER']),
  fullName: z.string().optional(),
  nationalId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const hashed = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashed,
        role: data.role as any,
      }
    })

    if (data.role === 'MEMBER' && data.fullName && data.nationalId) {
      await prisma.member.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          nationalId: data.nationalId,
          phone: data.phone || ''
        }
      })
    }

    return NextResponse.json({ id: user.id, email: user.email, role: user.role })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
