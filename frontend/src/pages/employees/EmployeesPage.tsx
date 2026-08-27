import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, UserCog, Shield } from 'lucide-react'
import api from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'seller', label: 'Sotuvchi (Seller)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'courier', label: 'Kuryer (Courier)', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'manager', label: 'Menejer (Manager)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'admin', label: 'Admin', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
]

async function fetchMembers() {
  const stored = localStorage.getItem('auth-storage')
  if (!stored) return []
  const parsed = JSON.parse(stored)
  const businessId = parsed.state?.business?.id
  if (!businessId) return []
  const res = await api.get(`/businesses/${businessId}/members/`)
  return res.data
}

async function fetchBusiness() {
  const stored = localStorage.getItem('auth-storage')
  if (!stored) return null
  const parsed = JSON.parse(stored)
  const business = parsed.state?.business
  if (!business?.id) return null
  const res = await api.get(`/businesses/${business.id}/`)
  return res.data
}

export function EmployeesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('seller')

  const { data: members, isLoading } = useQuery({
    queryKey: ['business-members'],
    queryFn: fetchMembers,
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const stored = localStorage.getItem('auth-storage')
      const parsed = JSON.parse(stored!)
      const businessId = parsed.state?.business?.id
      const res = await api.post(`/businesses/${businessId}/add_member/`, { email, role })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-members'] })
      toast.success(t('common.success'))
      setShowInvite(false)
      setEmail('')
      setRole('seller')
    },
    onError: () => toast.error(t('common.error')),
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const stored = localStorage.getItem('auth-storage')
      const parsed = JSON.parse(stored!)
      const businessId = parsed.state?.business?.id
      await api.delete(`/businesses/${businessId}/members/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-members'] })
      toast.success(t('common.success'))
    },
  })

  const memberList = Array.isArray(members) ? members : members?.items || []

  const columns: Column<any>[] = [
    { key: 'user_email', label: t('auth.email', 'Email'), render: (item) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{item.user_email || item.user?.email || '-'}</p>
        <p className="text-xs text-gray-500">{item.user_full_name || item.user?.full_name || ''}</p>
      </div>
    )},
    { key: 'role', label: t('employees.role', 'Role'), render: (item) => {
      const roleInfo = ROLES.find((r) => r.value === item.role)
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleInfo?.color || 'bg-gray-100 text-gray-700'}`}>
          <Shield className="h-3 w-3" />
          {roleInfo?.label || item.role}
        </span>
      )
    }},
    { key: 'is_active', label: t('common.status'), render: (item) => <StatusBadge status={item.is_active ? 'active' : 'inactive'} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('employees.teamMembers', 'Team Members')}
        action={
          <Button onClick={() => setShowInvite(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('employees.inviteMember', 'Invite Member')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={memberList}
        isLoading={isLoading}
        actions={(item) => (
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation()
            if (confirm(t('common.areYouSure'))) removeMutation.mutate(item.id)
          }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      />

      <Dialog open={showInvite} onClose={() => setShowInvite(false)}>
        <DialogHeader onClose={() => setShowInvite(false)}>
          <DialogTitle>{t('employees.inviteMember', 'Invite Member')}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <Input
            label={t('auth.email', 'Email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('employees.role', 'Role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                    role === r.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/10'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowInvite(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => inviteMutation.mutate()} disabled={!email.trim() || inviteMutation.isPending}>
            {inviteMutation.isPending ? t('common.processing') : t('common.send')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
