"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'

type Member = {
  id: string
  fullName: string
  idNumber: string
}

type Product = {
  id: string
  name: string
  description: string | null
}

export function NewLoanForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form data
  const [memberId, setMemberId] = useState('')
  const [productId, setProductId] = useState('')
  const [principal, setPrincipal] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [repaymentPeriod, setRepaymentPeriod] = useState('')
  const [repaymentPct, setRepaymentPct] = useState('100')
  
  // Dropdown data
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [membersRes, productsRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/products')
        ])
        
        if (membersRes.ok) {
          const data = await membersRes.json()
          setMembers(data.members || [])
        }
        
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoadingData(false)
      }
    }
    
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        memberId,
        productId,
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        repaymentPeriod: parseInt(repaymentPeriod),
        repaymentPct: parseFloat(repaymentPct)
      }

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create loan')
      }

      const data = await res.json()
      setSuccess(true)
      
      // Redirect to loans page after 2 seconds
      setTimeout(() => {
        router.push('/loans')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading form data...</span>
        </div>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="size-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold">Loan Created Successfully!</h2>
          <p className="text-muted-foreground">The loan application has been created in DRAFT status.</p>
          <p className="text-sm text-muted-foreground">Redirecting to loans page...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 dark:text-red-100">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="border px-3 py-2 rounded-md h-10 w-full"
            >
              <option value="">Select a member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} - {m.idNumber}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Select the member applying for the loan</p>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Loan Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="border px-3 py-2 rounded-md h-10 w-full"
            >
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Choose the loan product type</p>
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Principal Amount (KES) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="1"
              step="0.01"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g., 50000"
            />
            <p className="text-xs text-muted-foreground">Loan amount requested</p>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Interest Rate (%) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="e.g., 12"
            />
            <p className="text-xs text-muted-foreground">Annual interest rate percentage</p>
          </div>

          {/* Repayment Period */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Repayment Period (Months) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="1"
              step="1"
              value={repaymentPeriod}
              onChange={(e) => setRepaymentPeriod(e.target.value)}
              placeholder="e.g., 12"
            />
            <p className="text-xs text-muted-foreground">Number of months to repay the loan</p>
          </div>

          {/* Repayment Percentage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Repayment Percentage (%) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="1"
              max="100"
              step="0.01"
              value={repaymentPct}
              onChange={(e) => setRepaymentPct(e.target.value)}
              placeholder="e.g., 100"
            />
            <p className="text-xs text-muted-foreground">Percentage of principal to repay (default 100%)</p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/loans')}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Loan'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
