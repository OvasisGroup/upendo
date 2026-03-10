"use client"
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search as SearchIcon, Power, Ban } from 'lucide-react'

export function UsersContent() {
  const [users, setUsers] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const roleOptions = ['ADMINISTRATOR','CHAIRMAN','SECRETARY','TREASURER','MEMBER']

  async function load() {
    const r = await fetch('/api/admin/users', { cache: 'no-store' })
    const j = await r.json()
    setUsers(j.users || [])
  }
  useEffect(() => { load() }, [])

  const roles = useMemo(() => {
    const s = new Set<string>()
    users.forEach(u => { if (u.role) s.add(String(u.role)) })
    return Array.from(s).sort()
  }, [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...users]
    if (role !== 'ALL') list = list.filter(u => String(u.role) === role)
    if (q) {
      list = list.filter((u: any) => {
        const hay = [u.email, u.phone, u.role, u.isActive ? 'active' : 'inactive']
          .filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [users, query, role])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  useEffect(() => { setPage(1) }, [query, role, pageSize])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search users (email, phone, role)"
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  className="pl-9"
                />
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <select
                className="border px-2 py-1 rounded h-9 w-full"
                value={role}
                onChange={(e)=>setRole(e.target.value)}
              >
                <option value="ALL">All roles</option>
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
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
          <div className="text-xs text-muted-foreground self-center">{total} total</div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary bg-secondary/10">
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Phone</th>
              <th className="py-2 px-4">Role</th>
              <th className="py-2 px-4">Active</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-2 px-4 font-medium">{u.email}</td>
                <td className="py-2 px-4">{u.phone ?? '-'}</td>
                <td className="py-2 px-4">
                  <select
                    className="border px-2 py-1 rounded h-9"
                    value={u.role}
                    onChange={async (e)=>{
                      const newRole = e.target.value
                      await fetch(`/api/admin/users/${u.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: newRole }) })
                      await load()
                    }}
                  >
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="py-2 px-4">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${u.isActive ? 'text-green-700 bg-green-100' : 'text-zinc-700 bg-zinc-100'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <div className="flex gap-2">
                    <Button
                      variant={u.isActive ? 'destructive' : 'outline'}
                      size="sm"
                      className="px-2"
                      aria-label={u.isActive ? 'Deactivate' : 'Activate'}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                      onClick={async ()=>{
                        await fetch(`/api/admin/users/${u.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isActive: !u.isActive }) })
                        await load()
                      }}
                    >
                      {u.isActive ? <Ban className="size-4" /> : <Power className="size-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-muted-foreground" colSpan={5}>No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={currentPage===1}>Prev</Button>
          <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</Button>
        </div>
      </div>
    </div>
  )
}
