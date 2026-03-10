"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon, FileDown, Receipt, CheckCircle, Clock, DollarSign } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Loan = {
  id: string
  principal: number
  interestRate: number
  status: string
  member?: {
    fullName: string
  }
}

export function LoansContent() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/loans', { cache: 'no-store' })
    if (res.ok) {
      const j = await res.json()
      setLoans(j.loans)
      setError(null)
    } else {
      setError('Failed to load loans')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Export functions
  const exportToCSV = () => {
    const csvData = filtered.map(loan => ({
      'Loan ID': loan.id,
      'Principal': loan.principal,
      'Interest Rate (%)': loan.interestRate,
      'Status': loan.status,
      'Member': (loan as any)?.member?.fullName || 'N/A'
    }))
    
    const ws = XLSX.utils.json_to_sheet(csvData)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loans-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    const excelData = filtered.map(loan => ({
      'Loan ID': loan.id,
      'Principal': loan.principal,
      'Interest Rate (%)': loan.interestRate,
      'Status': loan.status,
      'Member': (loan as any)?.member?.fullName || 'N/A'
    }))
    
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Loans')
    XLSX.writeFile(wb, `loans-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Loans Report', 14, 20)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
    
    const tableData = filtered.map(loan => [
      loan.id,
      loan.principal.toLocaleString(),
      `${loan.interestRate}%`,
      loan.status,
      (loan as any)?.member?.fullName || 'N/A'
    ])
    
    autoTable(doc, {
      head: [['Loan ID', 'Principal', 'Interest Rate', 'Status', 'Member']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`loans-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Derived: available statuses
  const statuses = useMemo(() => {
    const s = new Set<string>()
    loans.forEach(l => { if (l.status) s.add(String(l.status)) })
    return Array.from(s).sort()
  }, [loans])

  // Filtered + sorted loans
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = [...loans]
    // sort by newest? leave as-is for now
    if (status !== 'ALL') list = list.filter(l => String(l.status) === status)
    if (q) {
      list = list.filter((l: any) => {
        const hay = [l.id, l.principal, l.status, l?.member?.fullName]
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

  // Calculate summary statistics
  const draftCount = loans.filter(l => l.status === 'DRAFT').length
  const pendingCount = loans.filter(l => l.status === 'PENDING_APPROVAL').length
  const approvedCount = loans.filter(l => l.status === 'APPROVED').length
  const disbursedCount = loans.filter(l => l.status === 'DISBURSED').length
  const totalPrincipal = loans.reduce((sum, l) => sum + (l.principal || 0), 0)
  const activePrincipal = loans.filter(l => l.status === 'DISBURSED').reduce((sum, l) => sum + (l.principal || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Loans</div>
              <div className="mt-2 text-3xl font-bold">{loans.length}</div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Receipt className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Disbursed</div>
              <div className="mt-2 text-3xl font-bold">{disbursedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active loans</div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
              <div className="mt-2 text-3xl font-bold">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">{approvedCount} approved</div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Clock className="size-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Amount Borrowed</div>
              <div className="mt-2 text-3xl font-bold">KES {totalPrincipal.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">KES {activePrincipal.toLocaleString()} currently active</div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <DollarSign className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Controls */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <div className="relative">
                <Input
                  placeholder="Search loans (id, status, member)"
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
              <FileDown className="size-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
              <FileDown className="size-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
              <FileDown className="size-4" />
              PDF
            </Button>
            <div className="text-xs text-muted-foreground self-center ml-2">{total} total</div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary bg-secondary/10">
              <th className="py-2 px-4">Loan ID</th>
              <th className="py-2 px-4">Member</th>
              <th className="py-2 px-4">Principal</th>
              <th className="py-2 px-4">Interest Rate</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(l => (
              <tr key={l.id} className="border-t hover:bg-secondary/5">
                <td className="py-2 px-4 font-medium">
                  <Link href={`/loans/${l.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {l.id.slice(0, 8)}...
                  </Link>
                </td>
                <td className="py-2 px-4">{l.member?.fullName || 'N/A'}</td>
                <td className="py-2 px-4">{l.principal}</td>
                <td className="py-2 px-4">{l.interestRate}%</td>
                <td className="py-2 px-4">{l.status}</td>
                <td className="py-2 px-4">
                  <Link href={`/loans/${l.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="py-4 px-4 text-muted-foreground" colSpan={6}>No loans found</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination controls */}
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
