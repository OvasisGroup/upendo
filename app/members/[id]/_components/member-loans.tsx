"use client"
import { useMemo, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon, FileDown, Table as TableIcon, FileText } from 'lucide-react'

type Loan = { id: string; principal?: number; status?: string }

export function MemberLoans({ loans }: { loans: Loan[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Derive available statuses
  const statuses = useMemo(() => {
    const s = new Set<string>()
    loans.forEach(l => { if (l.status) s.add(String(l.status)) })
    return Array.from(s).sort()
  }, [loans])

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...loans]
    if (status !== 'ALL') list = list.filter(l => String(l.status) === status)
    if (q) {
      list = list.filter((l: any) => {
        const hay = [l.id, l.principal, l.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [loans, query, status])

  // Pagination
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageRows = filtered.slice(start, end)

  useEffect(() => { setPage(1) }, [query, status, pageSize])

  function toCsv(rows: Loan[]) {
    const headers = ['Loan ID','Principal','Status']
    const esc = (s: any) => {
      const v = s == null ? '' : String(s)
      if (v.includes('"') || v.includes(',') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"'
      }
      return v
    }
    const lines = [headers.join(',')]
    for (const l of rows) {
      const line = [esc(l.id), esc(l.principal ?? ''), esc(l.status ?? '')].join(',')
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
    download('member_loans.csv', 'text/csv;charset=utf-8', csv)
  }

  function exportExcel() {
    const csv = toCsv(filtered)
    download('member_loans.xlsx', 'text/csv;charset=utf-8', csv)
  }

  function exportPdf() {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = filtered
      .map((l: any) => `
        <tr>
          <td>${l.id ?? ''}</td>
          <td>${l.principal ?? ''}</td>
          <td>${l.status ?? ''}</td>
        </tr>`)
      .join('')
    const html = `<!doctype html>
      <html><head><meta charset="utf-8" />
      <title>Member Loans Export</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ddd;padding:8px;font-size:12px}
        th{background:#f3f4f6;text-align:left}
      </style>
      </head>
      <body>
        <h2>Member Loans</h2>
        <table>
          <thead>
            <tr>
              <th>Loan ID</th><th>Principal</th><th>Status</th>
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
    <div className="space-y-3">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 md:items-end">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs text-muted-foreground">Search</label>
            <div className="relative">
              <Input
                placeholder="Search loans (id, status)"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                className="pl-9"
              />
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              className="border px-2 py-1 rounded h-9 w-full"
              value={status}
              onChange={(e)=>setStatus(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
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
            <TableIcon className="mr-2 size-4" />
            Export Excel
          </Button>
          <Button variant="secondary" className="text-white" onClick={exportPdf}>
            <FileText className="mr-2 size-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary bg-secondary/10">
              <th className="py-2 px-4">Loan ID</th>
              <th className="py-2 px-4">Principal</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="py-2 px-4">{l.id}</td>
                <td className="py-2 px-4">{l.principal ?? '-'}</td>
                <td className="py-2 px-4">{l.status ?? '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-muted-foreground" colSpan={3}>No loans</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
