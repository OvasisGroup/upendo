"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, UserCheck, UserX, Search as SearchIcon, FileDown, FileText, Plus, Table, Eye, Pencil, Trash2, Shuffle } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'

type Props = { meRole: string; isOwner: boolean }

export function MembersContent({ meRole, isOwner }: Props) {
  const [members, setMembers] = useState<any[]>([])
  const router = useRouter()

  async function load() {
    const r = await fetch('/api/members', { cache: 'no-store' })
    const j = await r.json()
    setMembers(j.members || [])
  }
  useEffect(() => { load() }, [])

  const canManage = isOwner || meRole === 'ADMINISTRATOR' || meRole === 'CHAIRMAN' || meRole === 'SECRETARY'

  // Edit/Create modal
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ fullName: '', nationalId: '', phone: '', status: 'ACTIVE' })

  function openCreate() {
    router.push('/members/new')
  }

  function openEditMember(m: any) {
    setEditing(m)
    setForm({ fullName: m.fullName ?? '', nationalId: m.nationalId ?? '', phone: m.phone ?? '', status: m.status ?? 'ACTIVE' })
    setOpenEdit(true)
  }

  async function saveMember() {
    if (!canManage) return
    const body = JSON.stringify(form)
    if (editing) {
      const res = await fetch(`/api/members/${editing.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body })
      if (res.ok) {
        setOpenEdit(false)
        await load()
      }
    } else {
      const res = await fetch('/api/members', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
      if (res.ok) {
        setOpenEdit(false)
        await load()
      }
    }
  }

  async function deleteMember(id: string) {
    if (!canManage) return
    const ok = window.confirm('Delete this member?')
    if (!ok) return
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  function statusClass(status?: string) {
    const s = (status ?? '').toUpperCase()
    switch (s) {
      case 'ACTIVE':
        return 'text-green-700 bg-green-100'
      case 'INACTIVE':
        return 'text-zinc-700 bg-zinc-100'
      case 'SUSPENDED':
        return 'text-orange-700 bg-orange-100'
      case 'PENDING':
        return 'text-amber-700 bg-amber-100'
      default:
        return 'text-blue-700 bg-blue-100'
    }
  }

  // Controls
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Derived: clusters
  const zones = useMemo(() => {
    const set = new Set<string>()
    members.forEach((m: any) => {
      if (m?.cluster?.name) set.add(m.cluster.name)
    })
    return Array.from(set).sort()
  }, [members])

  // Derived: filtered + sorted
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...members]
    // sort by createdAt desc when available
    list.sort((a: any, b: any) => {
      const ad = a?.createdAt ? new Date(a.createdAt).getTime() : 0
      const bd = b?.createdAt ? new Date(b.createdAt).getTime() : 0
      return bd - ad
    })
    if (zone !== 'ALL') {
      list = list.filter((m: any) => (m?.cluster?.name ?? '') === zone)
    }
    if (q) {
      list = list.filter((m: any) => {
        const hay = [m.fullName, m.nationalId, m.phone, m?.cluster?.name]
          .filter(Boolean)
          .join(' ') // simple concat
          .toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [members, query, zone])

  // Pagination slices
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  useEffect(() => {
    // reset to first page on query/zone/pageSize changes
    setPage(1)
  }, [query, zone, pageSize])

  function toCsv(rows: any[]) {
    const headers = ['Name','National ID','Phone','Cluster','Date Joined','Status']
    const esc = (s: any) => {
      const v = s == null ? '' : String(s)
      if (v.includes('"') || v.includes(',') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"'
      }
      return v
    }
    const lines = [headers.join(',')]
    for (const m of rows) {
      const line = [
        esc(m.fullName),
        esc(m.nationalId),
        esc(m.phone),
        esc(m?.cluster?.name ?? ''),
        esc(m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''),
        esc(m.status),
      ].join(',')
      lines.push(line)
    }
    return lines.join('\n')
  }

  function download(filename: string, mime: string, content: string | Blob) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function exportCsv() {
    const csv = toCsv(filtered)
    download('members.csv', 'text/csv;charset=utf-8', csv)
  }

  function exportExcel() {
    // Simple approach: export CSV with .xlsx-friendly content
    const csv = toCsv(filtered)
    download('members.xlsx', 'text/csv;charset=utf-8', csv)
  }

  function exportPdf() {
    // Lightweight approach: open a printable view; user can Save as PDF
    const win = window.open('', '_blank')
    if (!win) return
    const rows = filtered
      .map((m: any) => `
        <tr>
          <td>${m.fullName ?? ''}</td>
          <td>${m.nationalId ?? ''}</td>
          <td>${m.phone ?? ''}</td>
          <td>${m?.cluster?.name ?? ''}</td>
          <td>${m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}</td>
          <td>${m.status ?? ''}</td>
        </tr>`)
      .join('')
    const html = `<!doctype html>
      <html><head><meta charset="utf-8" />
      <title>Members Export</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ddd;padding:8px;font-size:12px}
        th{background:#f3f4f6;text-align:left}
      </style>
      </head>
      <body>
        <h2>Members</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>National ID</th><th>Phone</th><th>Cluster</th><th>Date Joined</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload=function(){window.print();}</script>
      </body></html>`
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search members (name, ID, phone, cluster)"
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  className="pl-9"
                />
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cluster</label>
              <select
                className="border px-2 py-1 rounded h-9 w-full"
                value={zone}
                onChange={(e)=>setZone(e.target.value)}
              >
                <option value="ALL">All clusters</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Page size</label>
              <select
                className="border px-2 py-1 rounded h-9 w-full"
                value={pageSize}
                onChange={(e)=>setPageSize(Number(e.target.value))}
              >
                {[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <Button variant="outline" onClick={exportCsv}>
              <FileDown className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <Table className="mr-2 size-4" />
              Export Excel
            </Button>
            <Button variant="secondary" className="text-white" onClick={exportPdf}>
              <FileText className="mr-2 size-4" />
              Export PDF
            </Button>
            {canManage && (
              <Button variant="secondary" className="text-white" onClick={openCreate}>
                <Plus className="mr-2 size-4" />
                Add Member
              </Button>
            )}
            {canManage && (
              <Button
                variant="outline"
                onClick={async () => {
                  const ok = window.confirm('Randomly assign clusters to members without one?')
                  if (!ok) return
                  const res = await fetch('/api/members/assign-clusters', { method: 'POST' })
                  if (res.ok) {
                    await load()
                  } else {
                    const j = await res.json().catch(()=>({ error: 'Failed' }))
                    alert(j.error || 'Failed to assign clusters')
                  }
                }}
                title="Randomly assign clusters to unassigned members"
              >
                <Shuffle className="mr-2 size-4" />
                Assign Clusters
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-secondary">Total members</div>
              <div className="mt-2 text-2xl font-semibold">{members.length}</div>
            </div>
            <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
              <Users />
            </div>
          </div>
        </Card>
        <Card className="p-4 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-secondary">Recently added</div>
              <div className="mt-2 text-2xl font-semibold">{members.slice(0,10).length}</div>
            </div>
            <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
              <UserPlus />
            </div>
          </div>
        </Card>
        <Card className="p-4 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-secondary">Active members</div>
              <div className="mt-2 text-2xl font-semibold">{members.filter((m:any)=> (m.status ?? '').toUpperCase() === 'ACTIVE').length}</div>
            </div>
            <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
              <UserCheck />
            </div>
          </div>
        </Card>
        <Card className="p-4 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-secondary">Inactive members</div>
              <div className="mt-2 text-2xl font-semibold">{members.filter((m:any)=> (m.status ?? '').toUpperCase() !== 'ACTIVE').length}</div>
            </div>
            <div className="text-secondary bg-secondary/10 rounded-md p-2 transition-transform group-hover:scale-105">
              <UserX />
            </div>
          </div>
        </Card>
      </div>

      {/* Development actions removed per request */}

      <Card className="p-2 md:p-4 overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="text-left text-primary">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">National ID</th>
              <th className="py-2 px-4">Phone</th>
              <th className="py-2 px-4">Cluster</th>
              <th className="py-2 px-4">Date Joined</th>
              <th className="py-2 px-4">Status</th>
              {canManage && (
                <th className="py-2 px-4 w-40 md:w-auto">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m:any)=> (
              <tr key={m.id} className="border-t">
                <td className="py-2 px-4 font-medium">
                  <Link href={`/members/${m.id}`} className="underline text-primary">
                    {m.fullName}
                  </Link>
                </td>
                <td className="py-2 px-4">{m.nationalId}</td>
                <td className="py-2 px-4">{m.phone}</td>
                <td className="py-2 px-4">{m.cluster?.name ?? '-'}</td>
                <td className="py-2 px-4">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '-'}</td>
                <td className="py-2 px-4">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusClass(m.status)}`}>
                    {m.status}
                  </span>
                </td>
                {canManage && (
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <Link href={`/members/${m.id}`}>
                        <Button variant="outline" size="sm" className="px-2" aria-label="View" title="View">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="px-2" onClick={()=>openEditMember(m)} aria-label="Edit" title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="destructive" size="sm" className="px-2" onClick={()=>deleteMember(m.id)} aria-label="Delete" title="Delete">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-muted-foreground" colSpan={canManage ? 7 : 6}>No members found</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={openEdit} onOpenChange={setOpenEdit}>
        <SheetContent className="w-[480px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Edit Member</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Full name</label>
              <Input value={form.fullName} onChange={e=>setForm({...form, fullName: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">National ID</label>
              <Input value={form.nationalId} onChange={e=>setForm({...form, nationalId: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select className="border px-2 py-1 rounded h-9 w-full" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                {['ACTIVE','INACTIVE','SUSPENDED','PENDING'].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setOpenEdit(false)}>Cancel</Button>
              <Button variant="secondary" className="text-white" onClick={saveMember}>Save changes</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {total === 0 ? 0 : start + 1}-{Math.min(end, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Prev</Button>
          <span className="min-w-[80px] text-center">Page {currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={()=>setPage(p=>Math.min(totalPages, p+1))}>Next</Button>
        </div>
      </div>
    </div>
  )
}
