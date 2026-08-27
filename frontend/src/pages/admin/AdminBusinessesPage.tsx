import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, CheckCircle, XCircle, Users } from 'lucide-react'
import api from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

export function AdminBusinessesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', business_name: '', first_name: '', last_name: '', phone: '', password: '12345678' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-businesses', page, search],
    queryFn: async () => {
      const res = await api.get('/platform-admin/businesses/', { params: { page, page_size: 20, search: search || undefined } })
      return res.data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => { const res = await api.patch(`/platform-admin/businesses/${id}/toggle/`); return res.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-businesses'] }); toast.success(t('common.success')) },
  })

  const createMutation = useMutation({
    mutationFn: async (formData: typeof form) => { const res = await api.post('/platform-admin/create-business/', formData); return res.data },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] })
      toast.success(t('common.success'))
      setShowCreate(false)
      setForm({ email: '', business_name: '', first_name: '', last_name: '', phone: '', password: '12345678' })
    },
    onError: () => toast.error(t('common.error')),
  })

  const columns: Column<any>[] = [
    { key: 'name', label: t('admin.businessName', 'Business'), render: (item) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
        <p className="text-xs text-gray-500">{item.member_count || 0} {t('admin.members', 'members')}</p>
      </div>
    )},
    { key: 'email', label: t('admin.email', 'Email'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.email}</span> },
    { key: 'is_active', label: t('common.status'), render: (item) => <StatusBadge status={item.is_active ? 'active' : 'inactive'} /> },
    { key: 'created_at', label: t('common.date'), render: (item) => <span className="text-sm text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.businesses', 'Businesses')}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />{t('admin.createBusiness', 'Create Business')}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.items || data || []}
        isLoading={isLoading}
        searchPlaceholder={t('admin.searchBusinesses', 'Search businesses...')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(item.id) }}>
            {item.is_active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
          </Button>
        )}
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>
          <DialogTitle>{t('admin.createBusiness', 'Create Business')}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <Input label={t('admin.ownerEmail', 'Owner Email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t('admin.businessName', 'Business Name')} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('auth.firstName', 'First Name')} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input label={t('auth.lastName', 'Last Name')} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <Input label={t('auth.phone', 'Phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t('auth.password', 'Password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => createMutation.mutate(form)} disabled={!form.email || !form.business_name || createMutation.isPending}>
            {createMutation.isPending ? t('common.processing') : t('common.create')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
