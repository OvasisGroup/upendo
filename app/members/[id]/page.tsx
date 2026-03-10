import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileMenu } from '@/app/dashboard/_components/profile-menu'
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav'
import { RefreshButton } from '@/app/dashboard/_components/refresh-button'
import { Card } from '@/components/ui/card'
import { MemberLoans } from './_components/member-loans'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CreditCard, Phone as PhoneIcon, MapPin, Mail, CalendarDays, BadgeCheck } from 'lucide-react'

type PageProps = { params: Promise<{ id: string }> }

export default async function MemberDetailPage({ params }: PageProps) {
  const { id: rawId } = await params
  const me = await getSession()
  if (!me) {
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <Link className="underline" href="/login">Go to Login</Link>
      </div>
    )
  }

  const memberId = typeof rawId === 'string' ? decodeURIComponent(rawId).trim() : ''
  if (!memberId) {
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
              <div className="flex-1 font-medium">Member details</div>
              <ProfileMenu email={me.email} />
            </header>
            <main className="p-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Member not found</h2>
                    <p className="text-sm text-muted-foreground">The requested member ID is missing or invalid.</p>
                  </div>
                  <Link href="/members">
                    <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                      <ArrowLeft className="mr-1 size-4" />
                      Back to members
                    </Button>
                  </Link>
                </div>
              </Card>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  // Try lookup by primary key `id`, then fallback to `nationalId` (also unique)
  let member: any = null
  try {
    member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { cluster: true, user: true, loans: true },
    })
  } catch {
    const legacy = await (prisma as any).member.findUnique({
      where: { id: memberId },
      include: { branch: true, user: true, loans: true },
    })
    if (legacy) member = { ...legacy, cluster: legacy.branch ? { name: legacy.branch.name, region: legacy.branch.code } : null }
  }
  if (!member) {
    try {
      member = await prisma.member.findUnique({
        where: { nationalId: memberId },
        include: { cluster: true, user: true, loans: true },
      })
    } catch {
      const legacy2 = await (prisma as any).member.findUnique({
        where: { nationalId: memberId },
        include: { branch: true, user: true, loans: true },
      })
      if (legacy2) member = { ...legacy2, cluster: legacy2.branch ? { name: legacy2.branch.name, region: legacy2.branch.code } : null }
    }
  }

  if (!member) {
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
              <div className="flex-1 font-medium">Member details</div>
              <ProfileMenu email={me.email} />
            </header>
            <main className="p-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Member not found</h2>
                    <p className="text-sm text-muted-foreground">We couldn’t find a member with ID “{memberId}”.</p>
                  </div>
                  <Link href="/members">
                    <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                      <ArrowLeft className="mr-1 size-4" />
                      Back to members
                    </Button>
                  </Link>
                </div>
              </Card>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  const loansCount = member.loans?.length ?? 0

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
              Member details
            </div>
            <ProfileMenu email={me.email} />
          </header>

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{member.fullName}</h1>
                <p className="text-sm text-muted-foreground">Member profile and activity</p>
              </div>
              <div className="flex items-center gap-2">
                <RefreshButton />
                <Link href="/members">
                  <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                    <ArrowLeft className="mr-1 size-4" />
                    Back to members
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">National ID</div>
                    <div className="mt-2 text-lg font-medium">{member.nationalId}</div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <CreditCard />
                  </div>
                </div>
              </Card>
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">Phone</div>
                    <div className="mt-2 text-lg font-medium">{member.phone}</div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <PhoneIcon />
                  </div>
                </div>
              </Card>
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">Cluster / Region</div>
                    <div className="mt-2 text-lg font-medium">{member.cluster ? `${member.cluster.name} (${member.cluster.region})` : '-'}</div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <MapPin />
                  </div>
                </div>
              </Card>
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">Email</div>
                    <div className="mt-2 text-lg font-medium">{member.user?.email ?? '-'}</div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <Mail />
                  </div>
                </div>
              </Card>
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">Date Joined</div>
                    <div className="mt-2 text-lg font-medium">{new Date(member.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <CalendarDays />
                  </div>
                </div>
              </Card>
              <Card className="p-4 group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-secondary">Status</div>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-secondary/10 text-secondary">
                        {member.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
                    <BadgeCheck />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Loans</h3>
                <span className="text-sm text-muted-foreground">{loansCount} total</span>
              </div>
              <MemberLoans loans={member.loans ?? []} />
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
