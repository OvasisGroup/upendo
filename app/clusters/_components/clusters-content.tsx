"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search as SearchIcon, Plus, Boxes, MapPin, Clock } from 'lucide-react'

export function ClustersContent() {
  const [clusters, setClusters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|undefined>()

  async function load() {
    setLoading(true)
    const res = await fetch('/api/clusters', { cache: 'no-store' })
    if (res.ok) {
      const j = await res.json()
      setClusters(j.clusters || [])
      setError(undefined)
    } else {
      setError('Failed to load clusters')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Controls
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<string>('ALL')
  const [pageSize, setPageSize] = useState(10)
  const regions = useMemo(() => {
    const s = new Set<string>()
    clusters.forEach((c: any) => { if (c?.region) s.add(String(c.region)) })
    return Array.from(s).sort()
  }, [clusters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...clusters]
    if (region !== 'ALL') list = list.filter(c => String(c.region) === region)
    if (q) {
      list = list.filter(c => [c.name, c.region].filter(Boolean).join(' ').toLowerCase().includes(q))
    }
    return list
  }, [clusters, query, region])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [query, region, pageSize])
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  // Summary metrics
  const totalClusters = clusters.length
  const distinctRegions = regions.length

  // Add Cluster modal
  const [openAdd, setOpenAdd] = useState(false)
  const [name, setName] = useState('')
  const [newRegion, setNewRegion] = useState('')
  // saccoId is derived on the server from session; no client field
  const [saveError, setSaveError] = useState<string|undefined>()

  async function createCluster() {
    setSaveError(undefined)
    const res = await fetch('/api/clusters', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, region: newRegion }) })
    if (!res.ok) {
      const j = await res.json().catch(()=>({ error: 'Failed to create' }))
      setSaveError(j.error || 'Failed to create')
      return
    }
    setOpenAdd(false)
    setName(''); setNewRegion('')
    await load()
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-secondary">Total clusters</div>
            <div className="p-2 rounded-full bg-secondary/20 text-primary">
              <Boxes className="size-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{totalClusters}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-secondary">Distinct regions</div>
            <div className="p-2 rounded-full bg-secondary/20 text-primary">
              <MapPin className="size-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{distinctRegions}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-secondary">Recently added</div>
            <div className="p-2 rounded-full bg-secondary/20 text-primary">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold">{clusters.slice(0,5).length}</div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search clusters (name, region)"
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                  className="pl-9"
                />
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Region</label>
              <select className="border px-2 py-1 rounded h-9 w-full" value={region} onChange={(e)=>setRegion(e.target.value)}>
                <option value="ALL">All regions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Page size</label>
              <select className="border px-2 py-1 rounded h-9 w-full" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>
                {[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" className="text-white" onClick={()=>setOpenAdd(true)}>
              <Plus className="mr-2 size-4" />
              Add Cluster
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-4 overflow-x-auto">
        {loading && <p className="text-sm">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-primary bg-secondary/10">
                <th className="py-2 px-4">Cluster name</th>
                <th className="py-2 px-4">Region</th>
                <th className="py-2 px-4">Members</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c:any)=> (
                <tr key={c.id} className="border-t">
                  <td className="py-2 px-4 font-medium">{c.name}</td>
                  <td className="py-2 px-4">{c.region}</td>
                  <td className="py-2 px-4">{c?._count?.members ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-muted-foreground" colSpan={3}>No clusters found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={page===1}>Prev</Button>
          <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</Button>
        </div>
      </div>

      {/* Add Cluster Sheet */}
      <Sheet open={openAdd} onOpenChange={setOpenAdd}>
        <SheetContent className="w-[480px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Add Cluster</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 p-4">
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <div>
              <label className="text-xs text-muted-foreground">Cluster name</label>
              <Input value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Region</label>
              <Input value={newRegion} onChange={e=>setNewRegion(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setOpenAdd(false)}>Cancel</Button>
              <Button variant="secondary" className="text-white" onClick={createCluster}>Create</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
