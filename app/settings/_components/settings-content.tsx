"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Database, Mail, Lock, Globe, CreditCard, Users, Building2, Package, Plus, Trash2, Loader2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  type: string
  interestRate: number
  repaymentPeriod: number
  repaymentPercent: number
  description: string | null
}

export function SettingsContent() {
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [addingProduct, setAddingProduct] = useState(false)
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'LOAN',
    interestRate: '',
    repaymentPeriod: '',
    repaymentPercent: '100'
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.interestRate || !newProduct.repaymentPeriod) {
      alert('Please fill in all required fields')
      return
    }

    setAddingProduct(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          type: newProduct.type,
          interestRate: parseFloat(newProduct.interestRate),
          repaymentPeriod: parseInt(newProduct.repaymentPeriod),
          repaymentPercent: parseFloat(newProduct.repaymentPercent)
        })
      })

      if (res.ok) {
        await loadProducts()
        setNewProduct({
          name: '',
          type: 'LOAN',
          interestRate: '',
          repaymentPeriod: '',
          repaymentPercent: '100'
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create product')
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setAddingProduct(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Loan Products Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Loan Products</h2>
            <p className="text-sm text-muted-foreground">Manage available loan products and their terms</p>
          </div>
        </div>

        {/* Add New Product Form */}
        <div className="mb-6 p-4 bg-secondary/20 rounded-lg space-y-4">
          <h3 className="font-medium text-sm">Add New Product</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-xs font-medium">Product Name <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Emergency Loan"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Type</label>
              <select
                className="border px-3 py-2 rounded-md h-10 w-full"
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              >
                <option value="LOAN">Loan</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Interest Rate (%) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 12"
                value={newProduct.interestRate}
                onChange={(e) => setNewProduct({ ...newProduct, interestRate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Repayment Period (Months) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 12"
                value={newProduct.repaymentPeriod}
                onChange={(e) => setNewProduct({ ...newProduct, repaymentPeriod: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium">Repayment Percent (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 100"
                value={newProduct.repaymentPercent}
                onChange={(e) => setNewProduct({ ...newProduct, repaymentPercent: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddProduct}
                disabled={addingProduct}
                className="w-full"
              >
                {addingProduct ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Add Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Existing Products</h3>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No products found. Add your first product above.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/10 text-left">
                    <th className="py-2 px-4 font-medium">Name</th>
                    <th className="py-2 px-4 font-medium">Type</th>
                    <th className="py-2 px-4 font-medium">Interest Rate</th>
                    <th className="py-2 px-4 font-medium">Period (Months)</th>
                    <th className="py-2 px-4 font-medium">Repayment %</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-t">
                      <td className="py-2 px-4 font-medium">{product.name}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          product.type === 'LOAN' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {product.type}
                        </span>
                      </td>
                      <td className="py-2 px-4">{product.interestRate}%</td>
                      <td className="py-2 px-4">{product.repaymentPeriod}</td>
                      <td className="py-2 px-4">{product.repaymentPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Globe className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">General Settings</h2>
            <p className="text-sm text-muted-foreground">Basic system configuration</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">System Name</label>
            <Input placeholder="Upendo SACCO Management" defaultValue="Upendo SACCO" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Time Zone</label>
            <select className="border px-3 py-2 rounded-md h-10 w-full">
              <option>Africa/Nairobi (EAT)</option>
              <option>Africa/Lagos (WAT)</option>
              <option>UTC</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Currency</label>
            <select className="border px-3 py-2 rounded-md h-10 w-full">
              <option>KES - Kenyan Shilling</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SACCO Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Building2 className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">SACCO Configuration</h2>
            <p className="text-sm text-muted-foreground">Organization-specific settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Default Approval Quorum</label>
            <Input type="number" placeholder="3" defaultValue="3" />
            <p className="text-xs text-muted-foreground">Number of approvals required for loan processing</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Maximum Loan Amount</label>
            <Input type="number" placeholder="1000000" defaultValue="500000" />
            <p className="text-xs text-muted-foreground">Maximum principal amount allowed per loan</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Minimum Members Per Cluster</label>
            <Input type="number" placeholder="5" defaultValue="5" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Bell className="size-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notification Settings</h2>
            <p className="text-sm text-muted-foreground">Configure system notifications</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Email Notifications</div>
              <p className="text-xs text-muted-foreground">Send email alerts for important events</p>
            </div>
            <input type="checkbox" className="size-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">SMS Notifications</div>
              <p className="text-xs text-muted-foreground">Send SMS alerts to members</p>
            </div>
            <input type="checkbox" className="size-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Loan Approval Alerts</div>
              <p className="text-xs text-muted-foreground">Notify approvers when new loan is submitted</p>
            </div>
            <input type="checkbox" className="size-4" defaultChecked />
          </div>
        </div>
      </Card>

      {/* Email Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Mail className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Email Configuration</h2>
            <p className="text-sm text-muted-foreground">SMTP and email settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">SMTP Host</label>
            <Input placeholder="smtp.gmail.com" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">SMTP Port</label>
            <Input type="number" placeholder="587" defaultValue="587" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">From Email</label>
            <Input type="email" placeholder="noreply@upendo.com" />
          </div>
        </div>
      </Card>

      {/* Payment Gateway */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <CreditCard className="size-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payment Gateway</h2>
            <p className="text-sm text-muted-foreground">M-PESA and payment settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">M-PESA Paybill Number</label>
            <Input placeholder="123456" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">M-PESA Consumer Key</label>
            <Input type="password" placeholder="Enter consumer key" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">M-PESA Consumer Secret</label>
            <Input type="password" placeholder="Enter consumer secret" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enable M-PESA STK Push</div>
              <p className="text-xs text-muted-foreground">Allow automatic payment requests</p>
            </div>
            <input type="checkbox" className="size-4" defaultChecked />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Lock className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Authentication and access control</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Session Timeout (minutes)</label>
            <Input type="number" placeholder="30" defaultValue="60" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Password Minimum Length</label>
            <Input type="number" placeholder="8" defaultValue="8" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require Two-Factor Authentication</div>
              <p className="text-xs text-muted-foreground">Enforce 2FA for all users</p>
            </div>
            <input type="checkbox" className="size-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enable Audit Logging</div>
              <p className="text-xs text-muted-foreground">Track all user actions</p>
            </div>
            <input type="checkbox" className="size-4" defaultChecked />
          </div>
        </div>
      </Card>

      {/* Database Backup */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
            <Database className="size-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Database & Backup</h2>
            <p className="text-sm text-muted-foreground">Data management settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Automatic Backup Schedule</label>
            <select className="border px-3 py-2 rounded-md h-10 w-full">
              <option>Daily at 2:00 AM</option>
              <option>Weekly on Sunday</option>
              <option>Monthly</option>
              <option>Disabled</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Backup Retention (days)</label>
            <Input type="number" placeholder="30" defaultValue="30" />
          </div>
          <Button variant="outline" className="w-full">
            <Database className="size-4 mr-2" />
            Create Manual Backup Now
          </Button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
