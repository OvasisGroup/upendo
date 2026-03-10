import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileMenu } from '@/app/dashboard/_components/profile-menu'
import { NotificationBell } from '@/app/dashboard/_components/notification-bell'
import { RefreshButton } from '@/app/dashboard/_components/refresh-button'
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav'
import { LoansContent } from './_components/loans-content'

export default async function LoansPage() {
  const me = await getSession()
  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <Link className="underline" href="/login">Go to Login</Link>
      </div>
    )
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
                <h1 className="text-2xl font-semibold">Loans</h1>
                <p className="text-sm text-muted-foreground">Manage and track loan applications</p>
              </div>
              <div className="flex gap-2">
                <Link href="/loans/new">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    New Loan
                  </button>
                </Link>
                <RefreshButton />
              </div>
            </div>

            <LoansContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
