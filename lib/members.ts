import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function defaultMemberApprovalQuorum() {
  const custom = await prisma.approvalQuorum.findFirst({ where: { entity: 'MEMBER' } })
  if (custom) return { requiredRoles: custom.requiredRoles as Role[], minApprovals: custom.minApprovals }
  return { requiredRoles: [Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER], minApprovals: 3 }
}

export async function ensureMemberApprovalRecords(memberId: string) {
  const { requiredRoles } = await defaultMemberApprovalQuorum()
  const existing = await prisma.memberApproval.findMany({ where: { memberId } })
  const have = new Set(existing.map(a => a.role))
  const toCreate = requiredRoles.filter(r => !have.has(r))
  if (toCreate.length) {
    await prisma.memberApproval.createMany({
      data: toCreate.map(role => ({ memberId, approverId: 'TBD', role }))
    })
  }
}

export async function updateMemberStatusIfApproved(memberId: string) {
  const quorum = await defaultMemberApprovalQuorum()
  const approvals = await prisma.memberApproval.findMany({ where: { memberId } })
  const approvedRoles = new Set(approvals.filter(a => a.status === 'APPROVED').map(a => a.role))
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
  const hasAllRequired = quorum.requiredRoles.every(r => approvedRoles.has(r))
  const meetsMin = approvedCount >= quorum.minApprovals
  if (hasAllRequired && meetsMin) {
    await prisma.member.update({ where: { id: memberId }, data: { status: 'ACTIVE' } })
  }
}
