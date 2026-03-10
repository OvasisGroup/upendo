import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RefreshButton } from './_components/refresh-button'
import { ProfileMenu } from './_components/profile-menu'
import { NotificationBell } from './_components/notification-bell'
import { SidebarNav } from './_components/sidebar-nav'
import { Users, Boxes, ClipboardList, BadgeCheck, Landmark, Wallet } from 'lucide-react'

async function getStats(role: string, userId: string) {
  if (role === 'MEMBER') {
    const member = await prisma.member.findFirst({ where: { userId } })
    const loans = await prisma.loan.count({ where: { memberId: member?.id } })
    const outstanding = await prisma.repaymentSchedule.findMany({ 
      where: { loan: { memberId: member?.id }, isPaid: false } 
    })
    const totalDue = outstanding.reduce((a, b) => a + b.totalDue, 0)
    return { loans, totalDue }
  }
  
  // For admin/staff roles
  const totalLoans = await prisma.loan.count()
  const totalMembers = await prisma.member.count()
  const totalProducts = await prisma.product.count()
  
  const disbursedLoans = await prisma.loan.findMany({
    where: { status: 'DISBURSED' },
    select: { principal: true }
  })
  const totalDisbursed = disbursedLoans.reduce((sum, loan) => sum + loan.principal, 0)
  
  const allRepayments = await prisma.repayment.findMany({
    select: { amountPaid: true }
  })
  const totalRepaid = allRepayments.reduce((sum, r) => sum + r.amountPaid, 0)
  
  // Count submitted loans awaiting approval
  const pendingApprovals = await prisma.loan.count({ 
    where: { status: 'SUBMITTED' } 
  })
  
  return { 
    totalLoans, 
    totalMembers, 
    totalProducts, 
    totalDisbursed,
    totalRepaid,
    pendingApprovals
  }
}

export default async function Dashboard() {
  const me = await getSession()
  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <Link className="underline" href="/login">Go to Login</Link>
      </div>
    )
  }

  const stats = await getStats(me.role, me.id)

  // Aggregate for charts
  const loanStatusCounts = await prisma.loan.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  const statusOrder = ['DRAFT', 'SUBMITTED', 'APPROVED', 'DISBURSED', 'COMPLETED', 'DEFAULTED']
  const orderedLoanStatus = statusOrder.map((s) => {
    const found = loanStatusCounts.find((x) => x.status === s)
    return { status: s, count: found?._count._all ?? 0 }
  })

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const recentMembers = await prisma.member.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  })
  const monthlyBuckets: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString(undefined, { month: 'short' })
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = recentMembers.filter((m) => m.createdAt >= d && m.createdAt < next).length
    monthlyBuckets.push({ label, count })
  }

  let summaryMembers: any[] = []
  try {
    summaryMembers = await prisma.member.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { cluster: true, user: true },
    })
  } catch {
    const legacy = await (prisma as any).member.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { branch: true, user: true },
    })
    summaryMembers = Array.isArray(legacy)
      ? legacy.map((m: any) => ({
          ...m,
          cluster: m.branch ? { name: m.branch.name, region: m.branch.code } : null,
        }))
      : []
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-svh w-full md:grid-cols-[260px_1fr]">
        <Sidebar>
          <SidebarHeader>
            <Link href="/dashboard" className="px-2 py-2 inline-flex items-center" aria-label="Home">
              <Image src="/images/upendi-landscape.svg" alt="Upendi" width={168} height={34} priority />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav role={me.role} isOwner={me.isOwner} />
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="px-2 text-xs text-muted-foreground">{me.email}</div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-5" />
            <div className="flex-1 font-medium">
              Welcome, <span className="text-muted-foreground">{me.email}</span>
            </div>
            <NotificationBell userId={me.id} />
            <ProfileMenu email={me.email} />
          </header>

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">
                  <span className={me.isOwner ? 'text-primary' : ''}>
                    {me.isOwner ? 'Owner' : me.role} Dashboard
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">Quick overview of your SACCO operations</p>
              </div>
              <RefreshButton />
            </div>

            {me.role !== 'MEMBER' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Loans</div>
                      <div className="mt-2 text-2xl font-semibold">{(stats as any).totalLoans}</div>
                      <div className="text-xs text-muted-foreground mt-1">All loan applications</div>
                    </div>
                    <div className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <Landmark className="size-6" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Members</div>
                      <div className="mt-2 text-2xl font-semibold">{(stats as any).totalMembers}</div>
                      <div className="text-xs text-muted-foreground mt-1">Registered members</div>
                    </div>
                    <div className="text-green-600 bg-green-100 dark:bg-green-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <Users className="size-6" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Disbursed Amount</div>
                      <div className="mt-2 text-2xl font-semibold">KES {(stats as any).totalDisbursed.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total loans given</div>
                    </div>
                    <div className="text-purple-600 bg-purple-100 dark:bg-purple-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <Wallet className="size-6" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Pending Approvals</div>
                      <div className="mt-2 text-2xl font-semibold">{(stats as any).pendingApprovals}</div>
                      <div className="text-xs text-muted-foreground mt-1">Awaiting approval</div>
                    </div>
                    <div className="text-orange-600 bg-orange-100 dark:bg-orange-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <ClipboardList className="size-6" />
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">My Loans</div>
                      <div className="mt-2 text-2xl font-semibold">{(stats as any).loans}</div>
                      <div className="text-xs text-muted-foreground mt-1">Total applications</div>
                    </div>
                    <div className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <Landmark className="size-6" />
                    </div>
                  </div>
                </Card>
                <Card className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Due</div>
                      <div className="mt-2 text-2xl font-semibold">KES {(stats as any).totalDue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">Outstanding balance</div>
                    </div>
                    <div className="text-orange-600 bg-orange-100 dark:bg-orange-900/30 rounded-md p-2 transition-transform group-hover:scale-105">
                      <Wallet className="size-6" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Loans by status</h3>
                    <p className="text-xs text-muted-foreground">Overview of loan pipeline</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3 items-end h-36">
                  {orderedLoanStatus.map((item) => {
                    const max = Math.max(...orderedLoanStatus.map((x) => x.count), 1)
                    const height = Math.round((item.count / max) * 100)
                    return (
                      <div key={item.status} className="flex flex-col items-center gap-2">
                        <div className="w-full bg-secondary/10 rounded-md">
                          <div
                            className="bg-secondary rounded-md"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.status}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">New members (6 months)</h3>
                    <p className="text-xs text-muted-foreground">Monthly onboarding trend</p>
                  </div>
                </div>
                {/* Inline responsive SVG line chart */}
                {(() => {
                  const max = Math.max(...monthlyBuckets.map((x) => x.count), 1)
                  const W = 600
                  const H = 144
                  const P = 16
                  const innerW = W - P * 2
                  const innerH = H - P * 2
                  const stepX = monthlyBuckets.length > 1 ? innerW / (monthlyBuckets.length - 1) : 0
                  const coords = monthlyBuckets.map((m, i) => {
                    const x = P + i * stepX
                    const y = P + (1 - m.count / max) * innerH
                    return { x, y, label: m.label, count: m.count }
                  })
                  const points = coords.map((c) => `${c.x},${c.y}`).join(' ')
                  return (
                    <div>
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36">
                        {/* grid baseline */}
                        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" className="opacity-20" />
                        {/* area under line (subtle) */}
                        <polyline points={`${P},${H - P} ${points} ${W - P},${H - P}`} fill="currentColor" className="opacity-10 text-secondary" />
                        {/* trend line */}
                        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={2} className="text-secondary" />
                        {/* points */}
                        {coords.map((c, idx) => (
                          <circle key={idx} cx={c.x} cy={c.y} r={3} fill="currentColor" className="text-secondary" />
                        ))}
                        {/* labels */}
                        {coords.map((c, idx) => (
                          <text key={`lbl-${idx}`} x={c.x} y={H - 2} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                            {c.label}
                          </text>
                        ))}
                      </svg>
                    </div>
                  )
                })()}
              </Card>
            </div>

            {/* Members summary table */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent members</h3>
                <Link href="/members" className="text-xs text-primary underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 px-4">Name</th>
                      <th className="py-2 px-4">Phone</th>
                      <th className="py-2 px-4">Cluster</th>
                      <th className="py-2 px-4">Status</th>
                      <th className="py-2 px-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryMembers.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="py-2 px-4">{m.fullName}</td>
                        <td className="py-2 px-4">{m.phone}</td>
                        <td className="py-2 px-4">{m.cluster?.name ?? '-'}</td>
                        <td className="py-2 px-4">{m.status}</td>
                        <td className="py-2 px-4">{new Date(m.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
