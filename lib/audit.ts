import { prisma } from '@/lib/prisma'

export async function audit(userId: string | null, action: string, entity: string, entityId?: string) {
  try {
    await prisma.auditLog.create({ data: { userId: userId ?? 'anonymous', action, entity, entityId } })
  } catch (e) {
    // non-blocking
  }
}
