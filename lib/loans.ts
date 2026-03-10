import { prisma } from '@/lib/prisma'
import { LoanStatus, Role } from '@prisma/client'

export async function defaultApprovalQuorum() {
  const custom = await prisma.approvalQuorum.findFirst({ where: { entity: 'LOAN' } })
  if (custom) return { requiredRoles: custom.requiredRoles as Role[], minApprovals: custom.minApprovals }
  return { requiredRoles: [Role.CHAIRMAN, Role.SECRETARY, Role.TREASURER], minApprovals: 3 }
}

export async function ensureApprovalRecords(loanId: string) {
  const { requiredRoles } = await defaultApprovalQuorum()
  const existing = await prisma.loanApproval.findMany({ where: { loanId } })
  const have = new Set(existing.map(a => a.role))
  const toCreate = requiredRoles.filter(r => !have.has(r))
  if (toCreate.length) {
    await prisma.loanApproval.createMany({
      data: toCreate.map(role => ({ loanId, approverId: 'TBD', role }))
    })
  }
}

export function generateAmortization(
  principal: number,
  interestRate: number,
  periods: number,
  startDate = new Date()
) {
  const schedule: {
    installmentNo: number
    dueDate: Date
    principal: number
    interest: number
    totalDue: number
  }[] = []
  const r = interestRate / 12 / 100
  const n = periods
  const payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n))
  let balance = principal
  for (let i = 1; i <= n; i++) {
    const interest = r === 0 ? 0 : balance * r
    const principalPaid = Math.min(balance, payment - interest)
    balance = Math.max(0, balance - principalPaid)
    const due = new Date(startDate)
    due.setMonth(due.getMonth() + i)
    schedule.push({
      installmentNo: i,
      dueDate: due,
      principal: round2(principalPaid),
      interest: round2(interest),
      totalDue: round2(principalPaid + interest)
    })
  }
  return schedule
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export async function updateLoanStatusIfApproved(loanId: string) {
  const quorum = await defaultApprovalQuorum()
  const approvals = await prisma.loanApproval.findMany({ where: { loanId } })
  const approvedRoles = new Set(approvals.filter(a => a.status === 'APPROVED').map(a => a.role))
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
  const hasAllRequired = quorum.requiredRoles.every(r => approvedRoles.has(r))
  const meetsMin = approvedCount >= quorum.minApprovals
  if (hasAllRequired && meetsMin) {
    await prisma.loan.update({ where: { id: loanId }, data: { status: LoanStatus.APPROVED } })
  }
}
