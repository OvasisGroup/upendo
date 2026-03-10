"use client"
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ProductsContent() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', type: 'LOAN', interestRate: 12, repaymentPeriod: 12, repaymentPercent: 10 })
  const [error, setError] = useState<string|undefined>()

  async function load() {
    const r = await fetch('/api/products', { cache: 'no-store' })
    const j = await r.json()
    setProducts(j.products || [])
  }
  useEffect(() => { load() }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    const res = await fetch('/api/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, interestRate: Number(form.interestRate), repaymentPeriod: Number(form.repaymentPeriod), repaymentPercent: Number(form.repaymentPercent) }) })
    if (!res.ok) setError('Failed to create')
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total products</div>
          <div className="mt-2 text-2xl font-semibold">{products.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Loan products</div>
          <div className="mt-2 text-2xl font-semibold">{products.filter(p=>p.type==='LOAN').length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Savings products</div>
          <div className="mt-2 text-2xl font-semibold">{products.filter(p=>p.type==='SAVINGS').length}</div>
        </Card>
      </div>

      <Card className="p-4 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input className="border px-2 py-1 w-full" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          <select className="border px-2 py-1 w-full" value={form.type} onChange={e=>setForm({...form, type: e.target.value as any})}>
            <option value="LOAN">LOAN</option>
            <option value="SAVINGS">SAVINGS</option>
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input className="border px-2 py-1" type="number" step="0.01" placeholder="Interest %" value={form.interestRate} onChange={e=>setForm({...form, interestRate: Number(e.target.value)})} />
            <input className="border px-2 py-1" type="number" placeholder="Period (months)" value={form.repaymentPeriod} onChange={e=>setForm({...form, repaymentPeriod: Number(e.target.value)})} />
            <input className="border px-2 py-1" type="number" step="0.01" placeholder="Repay %" value={form.repaymentPercent} onChange={e=>setForm({...form, repaymentPercent: Number(e.target.value)})} />
          </div>
          <Button type="submit" variant="secondary" className="text-white">Create</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-primary">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Type</th>
              <th className="py-2 px-4">Interest %</th>
              <th className="py-2 px-4">Repay period</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p:any)=> (
              <tr key={p.id} className="border-t">
                <td className="py-2 px-4 font-medium">{p.name}</td>
                <td className="py-2 px-4">{p.type}</td>
                <td className="py-2 px-4">{p.interestRate}%</td>
                <td className="py-2 px-4">{p.repaymentPeriod}m</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-muted-foreground" colSpan={4}>No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
