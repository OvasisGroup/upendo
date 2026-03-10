import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { ClustersContent } from './_components/clusters-content'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileMenu } from '@/app/dashboard/_components/profile-menu'
import { RefreshButton } from '@/app/dashboard/_components/refresh-button'
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav'
import { NotificationBell } from '@/app/dashboard/_components/notification-bell'
import { Card } from '@/components/ui/card'

// Client component will load data

export default async function ClustersPage() {
  const me = await getSession()
  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <Link className="underline" href="/login">Go to Login</Link>
      </div>
    )
  }

  // Summary will be displayed by the client component

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
              Clusters
            </div>
            <NotificationBell userId={me.id} />
            <ProfileMenu email={me.email} />
          </header>

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Clusters</h1>
                <p className="text-sm text-muted-foreground">Manage clusters and their regions</p>
              </div>
              <RefreshButton />
            </div>

            <ClustersContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
