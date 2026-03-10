'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ClientNewMemberForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [clusterId, setClusterId] = useState('')
  const [clusters, setClusters] = useState<{ id: string; name?: string; region?: string }[]>([])
  const [error, setError] = useState<string|undefined>()
  const [success, setSuccess] = useState<string|undefined>()
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    setSuccess(undefined)
    setLoading(true)
    const payload: Record<string, unknown> = { fullName, nationalId, phone }
    if (clusterId) payload.clusterId = clusterId
    if (email.trim()) payload.email = email.trim()
    if (password.trim()) payload.password = password
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(()=>({ error: 'Failed to create' }))
      setError(j.error || 'Failed to create')
      return
    }
    setSuccess('Member submitted for approval. Status will activate after required approvals.')
    setEmail(''); setPassword(''); setFullName(''); setNationalId(''); setPhone(''); setClusterId('')
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/clusters', { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setClusters(Array.isArray(j.clusters) ? j.clusters : [])
        }
      } catch {}
    })()
  }, [])

  return (
    <Card className="p-4 max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Input placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        <Input type="password" placeholder="Temporary Password (optional)" value={password} onChange={e=>setPassword(e.target.value)} />
        <Input placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <Input placeholder="National ID" value={nationalId} onChange={e=>setNationalId(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <div>
          <label className="text-xs text-muted-foreground">Cluster (optional)</label>
          <select
            className="mt-1 border px-2 py-1 rounded h-9 w-full"
            value={clusterId}
            onChange={(e)=>setClusterId(e.target.value)}
          >
            <option value="">No cluster</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? 'Unnamed'}{c.region ? ` (${c.region})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Link href="/members" className="inline-flex items-center underline text-primary">Cancel</Link>
          <Button type="submit" variant="secondary" className="text-white" disabled={loading}>{loading ? 'Submitting…' : 'Submit for approval'}</Button>
        </div>
      </form>
    </Card>
  )
}
