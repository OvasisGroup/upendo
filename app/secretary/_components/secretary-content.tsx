'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserPlus, FileText, ClipboardCheck, Calendar, ArrowRight, Eye } from 'lucide-react'
import Link from 'next/link'

interface SecretaryContentProps {
  stats: {
    totalMembers: number
    activeMembers: number
    pendingMembers: number
    totalLoans: number
    documentsToReview: number
    upcomingMeetings: number
    pendingMemberApprovalsCount: number
    pendingLoanApprovalsCount: number
  }
  recentLoans: any[]
  recentMembers: any[]
  upcomingNotifications: any[]
  pendingMemberApprovals: any[]
  pendingLoanApprovals: any[]
}

export function SecretaryContent({ stats, recentLoans, recentMembers, upcomingNotifications, pendingMemberApprovals, pendingLoanApprovals }: SecretaryContentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50'
      case 'PENDING': return 'text-yellow-600 bg-yellow-50'
      case 'SUBMITTED': return 'text-blue-600 bg-blue-50'
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50'
      case 'DISBURSED': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Calculate items needing secretary's approval
  const membersNeedingApproval = pendingMemberApprovals.filter(m => 
    !m.approvals?.some((a: any) => a.role === 'SECRETARY' && a.status === 'APPROVED')
  )
  const loansNeedingApproval = pendingLoanApprovals.filter(l => 
    !l.approvals?.some((a: any) => a.role === 'SECRETARY' && a.status === 'APPROVED')
  )

  return (
    <div className="space-y-6">
      {/* Urgent Notifications */}
      {(membersNeedingApproval.length > 0 || loansNeedingApproval.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Action Required: Pending Approvals
              </h3>
              <div className="space-y-2">
                {membersNeedingApproval.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-semibold">
                      {membersNeedingApproval.length}
                    </span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {membersNeedingApproval.length === 1 ? 'member application' : 'member applications'} awaiting your approval
                    </p>
                    <Link href="#member-approvals" className="ml-auto">
                      <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900 hover:bg-amber-50">
                        Review Members
                      </Button>
                    </Link>
                  </div>
                )}
                {loansNeedingApproval.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                      {loansNeedingApproval.length}
                    </span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {loansNeedingApproval.length === 1 ? 'loan application' : 'loan applications'} awaiting your approval
                    </p>
                    <Link href="#loan-approvals" className="ml-auto">
                      <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900 hover:bg-blue-50">
                        Review Loans
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <p className="text-3xl font-bold">{stats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">
                {stats.activeMembers} active, {stats.pendingMembers} pending
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <Link href="/members">
            <Button variant="link" className="mt-4 p-0 h-auto text-sm">
              View all members <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Members</p>
              <p className="text-3xl font-bold">{stats.activeMembers}</p>
              <p className="text-xs text-muted-foreground">
                {((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <p className="text-3xl font-bold">{stats.pendingMembers}</p>
              <p className="text-xs text-muted-foreground">
                New member applications
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <Link href="/members">
            <Button variant="link" className="mt-4 p-0 h-auto text-sm">
              Review applications <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Documents to Review</p>
              <p className="text-3xl font-bold">{stats.documentsToReview}</p>
              <p className="text-xs text-muted-foreground">
                Loan applications submitted
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <Link href="/loans">
            <Button variant="link" className="mt-4 p-0 h-auto text-sm">
              Review documents <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
              <p className="text-3xl font-bold">{stats.totalLoans}</p>
              <p className="text-xs text-muted-foreground">
                All loan records
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
              <p className="text-3xl font-bold">{stats.upcomingMeetings}</p>
              <p className="text-xs text-muted-foreground">
                Pending notifications
              </p>
            </div>
            <div className="p-3 bg-rose-100 rounded-lg">
              <Calendar className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      <div className="grid gap-6 md:grid-cols-2" id="pending-approvals">
        {/* Pending Member Approvals */}
        <Card id="member-approvals">
          <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pending Member Approvals</h2>
                <p className="text-sm text-muted-foreground">Members awaiting your approval</p>
              </div>
              <div className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-semibold">
                {stats.pendingMemberApprovalsCount}
              </div>
            </div>
          </div>
          <div className="p-6">
            {pendingMemberApprovals.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No pending member approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMemberApprovals.map((member) => {
                  const displayName = member.user?.name || member.firstName || 'Unknown'
                  const fullName = member.user?.name || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName || 'Unknown')
                  const approvedRoles = member.approvals?.filter((a: any) => a.status === 'APPROVED').map((a: any) => a.role) || []
                  const secretaryApproval = member.approvals?.find((a: any) => a.role === 'SECRETARY')
                  const secretaryApproved = secretaryApproval?.status === 'APPROVED'
                  const secretaryRejected = secretaryApproval?.status === 'REJECTED'
                  
                  return (
                    <div key={member.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.cluster?.name || 'No cluster'} • {member.phoneNumber || 'No phone'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {approvedRoles.length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                                  ✓ {approvedRoles.join(', ')}
                                </span>
                              )}
                              {secretaryApproved ? (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                                  ✓ You Approved
                                </span>
                              ) : secretaryRejected ? (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded">
                                  ✗ You Rejected
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                                  ⏳ Awaiting Your Approval
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link href={`/members/${member.id}`}>
                          <Button variant={secretaryApproved ? "ghost" : "outline"} size="sm">
                            {secretaryApproved ? 'View' : 'Review'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Pending Loan Approvals */}
        <Card id="loan-approvals">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pending Loan Approvals</h2>
                <p className="text-sm text-muted-foreground">Loans awaiting your approval</p>
              </div>
              <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                {stats.pendingLoanApprovalsCount}
              </div>
            </div>
          </div>
          <div className="p-6">
            {pendingLoanApprovals.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No pending loan approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLoanApprovals.map((loan) => {
                  const memberName = loan.member.user?.name || 
                    (loan.member.firstName && loan.member.lastName 
                      ? `${loan.member.firstName} ${loan.member.lastName}` 
                      : loan.member.firstName || loan.member.lastName || 'Unknown Member')
                  const approvedRoles = loan.approvals?.filter((a: any) => a.status === 'APPROVED').map((a: any) => a.role) || []
                  const secretaryApproval = loan.approvals?.find((a: any) => a.role === 'SECRETARY')
                  const secretaryApproved = secretaryApproval?.status === 'APPROVED'
                  const secretaryRejected = secretaryApproval?.status === 'REJECTED'
                  
                  return (
                    <div key={loan.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {loan.product.name} • {formatCurrency(loan.principal)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {approvedRoles.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                                ✓ {approvedRoles.join(', ')}
                              </span>
                            )}
                            {secretaryApproved ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                                ✓ You Approved
                              </span>
                            ) : secretaryRejected ? (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded">
                                ✗ You Rejected
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                                ⏳ Awaiting Your Approval
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(loan.createdAt)}</p>
                        </div>
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant={secretaryApproved ? "ghost" : "outline"} size="sm">
                            {secretaryApproved ? 'View' : 'Review'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Loan Applications */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Loan Applications</h2>
              <p className="text-sm text-muted-foreground">Latest loan submissions for review</p>
            </div>
            <Link href="/loans">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent loan applications</p>
          ) : (
            <div className="space-y-3">
              {recentLoans.map((loan) => {
                const memberName = loan.member.user?.name || 
                  (loan.member.firstName && loan.member.lastName 
                    ? `${loan.member.firstName} ${loan.member.lastName}` 
                    : loan.member.firstName || loan.member.lastName || 'Unknown Member')
                
                return (
                  <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {loan.product.name} • {formatCurrency(loan.principal)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(loan.createdAt)}</p>
                      </div>
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Member Registrations */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Member Registrations</h2>
              <p className="text-sm text-muted-foreground">Newest members added to the system</p>
            </div>
            <Link href="/members">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent member registrations</p>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((member) => {
                const displayName = member.user?.name || member.firstName || 'Unknown'
                const fullName = member.user?.name || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName || 'Unknown')
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.cluster?.name || 'No cluster'} • {member.phoneNumber || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(member.status)}`}>
                          {member.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(member.createdAt)}</p>
                    </div>
                    <Link href={`/members/${member.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Common secretary tasks</p>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/members/new">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <UserPlus className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Register New Member</p>
                <p className="text-xs text-muted-foreground">Add a new SACCO member</p>
              </div>
            </Button>
          </Link>
          <Link href="/members">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <UserCheck className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Approve Members</p>
                <p className="text-xs text-muted-foreground">Review pending applications</p>
              </div>
            </Button>
          </Link>
          <Link href="/loans">
            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <FileText className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Review Documents</p>
                <p className="text-xs text-muted-foreground">Check loan applications</p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
