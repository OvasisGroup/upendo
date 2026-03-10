"use client"
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Building2, Percent, Calendar, DollarSign, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

type Loan = {
  id: string
  principal: number
  interestRate: number
  repaymentPct: number
  status: string
  createdAt: string
  disbursedAt: string | null
  member: {
    id: string
    fullName: string
    idNumber: string
    phoneNumber: string | null
    email: string | null
    cluster: {
      name: string
    } | null
    user: {
      email: string
    } | null
  }
  product: {
    id: string
    name: string
    type: string
    description: string | null
  }
  approvals: Array<{
    id: string
    status: string
    createdAt: string
    approverId: string
    approver: {
      email: string
      role: string
    } | null
  }>
  schedule: Array<{
    id: string
    installmentNo: number
    dueDate: string
    principal: number
    interest: number
    totalDue: number
    isPaid: boolean
  }>
  repayments: Array<{
    id: string
    amountPaid: number
    paymentDate: string
  }>
}

export function LoanDetails({ loanId }: { loanId: string }) {
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/loans/${loanId}`)
        if (res.ok) {
          const data = await res.json()
          setLoan(data.loan)
          setError(null)
        } else {
          setError('Failed to load loan details')
        }
      } catch (err) {
        setError('An error occurred')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loanId])

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading loan details...</span>
        </div>
      </Card>
    )
  }

  if (error || !loan) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">{error || 'Loan not found'}</div>
      </Card>
    )
  }

  const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amountPaid, 0)
  const totalDue = loan.schedule.reduce((sum, s) => sum + s.totalDue, 0)
  const balance = totalDue - totalPaid

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'DISBURSED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loan #{loan.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">Detailed loan information</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
          {loan.status.replace('_', ' ')}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Principal</div>
              <div className="text-xl font-bold">KES {loan.principal.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Percent className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Interest Rate</div>
              <div className="text-xl font-bold">{loan.interestRate}%</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
              <div className="text-xl font-bold">KES {totalPaid.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-xl font-bold">KES {balance.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Member Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <User className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold">Member Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Full Name</label>
            <div className="font-medium">{loan.member.fullName}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">ID Number</label>
            <div className="font-medium">{loan.member.idNumber}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Phone Number</label>
            <div className="font-medium">{loan.member.phoneNumber || 'N/A'}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="font-medium">{loan.member.email || loan.member.user?.email || 'N/A'}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Cluster</label>
            <div className="font-medium">{loan.member.cluster?.name || 'N/A'}</div>
          </div>
        </div>
      </Card>

      {/* Loan Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <FileText className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold">Loan Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Product</label>
            <div className="font-medium">{loan.product.name}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Product Type</label>
            <div className="font-medium">{loan.product.type}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Repayment Percentage</label>
            <div className="font-medium">{loan.repaymentPct}%</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Created At</label>
            <div className="font-medium">{new Date(loan.createdAt).toLocaleString()}</div>
          </div>
          {loan.disbursedAt && (
            <div>
              <label className="text-sm text-muted-foreground">Disbursed At</label>
              <div className="font-medium">{new Date(loan.disbursedAt).toLocaleString()}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Approvals */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Approval History</h2>
        {loan.approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approvals yet</p>
        ) : (
          <div className="space-y-3">
            {loan.approvals.map(approval => (
              <div key={approval.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-1">
                  {approval.status === 'APPROVED' ? (
                    <CheckCircle className="size-5 text-green-600" />
                  ) : approval.status === 'REJECTED' ? (
                    <XCircle className="size-5 text-red-600" />
                  ) : (
                    <Clock className="size-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{approval.approver?.email || 'Unknown'}</span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">{approval.approver?.role || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {approval.status === 'APPROVED' ? 'Approved' : approval.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(approval.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Repayment Schedule */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Repayment Schedule</h2>
        {loan.schedule.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schedule available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Installment</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3">Principal</th>
                  <th className="py-2 px-3">Interest</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.map(installment => (
                  <tr key={installment.id} className="border-b">
                    <td className="py-2 px-3">{installment.installmentNo}</td>
                    <td className="py-2 px-3">{new Date(installment.dueDate).toLocaleDateString()}</td>
                    <td className="py-2 px-3">KES {installment.principal.toLocaleString()}</td>
                    <td className="py-2 px-3">KES {installment.interest.toLocaleString()}</td>
                    <td className="py-2 px-3 font-medium">KES {installment.totalDue.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        installment.isPaid 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {installment.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Repayments History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Repayment History</h2>
        {loan.repayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No repayments yet</p>
        ) : (
          <div className="space-y-2">
            {loan.repayments.map(repayment => (
              <div key={repayment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">KES {repayment.amountPaid.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(repayment.paymentDate).toLocaleString()}
                  </div>
                </div>
                <CheckCircle className="size-5 text-green-600" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
