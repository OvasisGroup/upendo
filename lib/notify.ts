import { prisma } from '@/lib/prisma'

export async function notify(userId: string, title: string, message: string, type: 'SMS'|'EMAIL'|'IN_APP' = 'IN_APP') {
  try {
    await prisma.notification.create({ data: { userId, title, message, type: type as any } })
  } catch (e) {
    // non-blocking
  }
}
