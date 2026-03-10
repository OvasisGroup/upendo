import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding disabled in production' }, { status: 403 })
  }

  try {
    const sacco = await prisma.sacco.upsert({
      where: { code: 'UPND' },
      update: {},
      create: { name: 'Upendo SACCO', code: 'UPND' },
    })

    const clusterDefs = [
      { name: 'Central Cluster', region: 'Central' },
      { name: 'Eastern Cluster', region: 'East' },
      { name: 'Western Cluster', region: 'West' },
    ]

    const clusters = [] as { id: string; name: string; region: string }[]
    for (const def of clusterDefs) {
      const c = await prisma.cluster.create({
        data: { name: def.name, region: def.region, saccoId: sacco.id },
      })
      clusters.push(c)
    }

    const count = 25
    let created = 0
    const passwordHash = await bcrypt.hash('Password123!', 10)

    for (let i = 1; i <= count; i++) {
      const email = `member${i}@example.com`
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) continue

      const phone = `07${Math.floor(10000000 + Math.random() * 89999999)}`
      const nationalId = `${10000000 + i}`
      const fullName = `Member ${i}`
      const cluster = clusters[i % clusters.length]
      const joinedDaysAgo = Math.floor(Math.random() * 180)
      const joinedDate = new Date(Date.now() - joinedDaysAgo * 24 * 60 * 60 * 1000)

      const user = await prisma.user.create({
        data: {
          email,
          phone,
          password: passwordHash,
          role: 'MEMBER',
          isActive: true,
        },
      })

      await prisma.member.create({
        data: {
          userId: user.id,
          clusterId: cluster?.id,
          fullName,
          nationalId,
          phone,
          status: 'ACTIVE',
          createdAt: joinedDate,
        },
      })
      created++
    }

    return NextResponse.json({ created })
  } catch (err: any) {
    console.error('Seed error', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
