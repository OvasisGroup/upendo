import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RefreshButton } from '@/app/dashboard/_components/refresh-button'
import { ProfileMenu } from '@/app/dashboard/_components/profile-menu'
import { NotificationBell } from '@/app/dashboard/_components/notification-bell'
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav'
import { redirect } from 'next/navigation'
import { SecretaryContent } from './_components/secretary-content'

export default async function SecretaryDashboard() {
  const me = await getSession()
  if (!me) {
    redirect('/login')
  }

  // Only secretaries can access this dashboard
  if (me.role !== 'SECRETARY') {
    redirect('/dashboard')
  }

  // Get secretary-specific statistics
  const totalMembers = await prisma.member.count()
  const activeMembers = await prisma.member.count({ 
    where: { status: 'ACTIVE' } 
  })
  const pendingMembers = await prisma.member.count({ 
    where: { status: 'PENDING' } 
  })

  // Recent loan applications
  const recentLoans = await prisma.loan.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        include: { user: true }
      },
      product: true
    }
  })

  // Upcoming meetings (using notifications as proxy for now)
  const upcomingNotifications = await prisma.notification.findMany({
    where: {
      status: 'PENDING',
      type: 'IN_APP'
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  // Recent member registrations
  const recentMembers = await prisma.member.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      cluster: true
    }
  })

  // Document statistics
  const totalLoans = await prisma.loan.count()
  const documentsToReview = await prisma.loan.count({
    where: { status: 'SUBMITTED' }
  })

  // Get pending approvals for secretary
  const pendingMemberApprovals = await prisma.member.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      user: true,
      cluster: true,
      approvals: true
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  })

  const pendingLoanApprovals = await prisma.loan.findMany({
    where: {
      status: 'SUBMITTED'
    },
    include: {
      member: {
        include: { user: true }
      },
      product: true,
      approvals: true
    },
    take: 20,
    orderBy: { createdAt: 'desc' }
  })

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
              Secretary Dashboard
            </div>
            <NotificationBell userId={me.id} />
            <ProfileMenu email={me.email} />
          </header>

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">
                  Secretary Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage members, documents, and administrative tasks
                </p>
              </div>
              <RefreshButton />
            </div>

            <SecretaryContent 
              stats={{
                totalMembers,
                activeMembers,
                pendingMembers,
                totalLoans,
                documentsToReview,
                upcomingMeetings: upcomingNotifications.length,
                pendingMemberApprovalsCount: pendingMemberApprovals.length,
                pendingLoanApprovalsCount: pendingLoanApprovals.length
              }}
              recentLoans={recentLoans}
              recentMembers={recentMembers}
              upcomingNotifications={upcomingNotifications}
              pendingMemberApprovals={pendingMemberApprovals}
              pendingLoanApprovals={pendingLoanApprovals}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
