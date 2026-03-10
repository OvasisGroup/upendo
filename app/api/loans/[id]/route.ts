import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      member: {
        include: {
          cluster: true,
          user: {
            select: {
              email: true
            }
          }
        }
      },
      product: true,
      approvals: true,
      schedule: {
        orderBy: {
          dueDate: 'asc'
        }
      },
      repayments: {
        orderBy: {
          paymentDate: 'desc'
        }
      }
    }
  })

  if (!loan) {
    return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  }

  // Fetch approver details separately
  const approvalsWithUsers = await Promise.all(
    loan.approvals.map(async (approval) => {
      const user = await prisma.user.findUnique({
        where: { id: approval.approverId },
        select: { email: true, role: true }
      })
      return {
        ...approval,
        approver: user
      }
    })
  )

  return NextResponse.json({ 
    loan: {
      ...loan,
      approvals: approvalsWithUsers
    }
  })
}
