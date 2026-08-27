import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { customersApi, type CustomerFilters } from '@/api/customers'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '', notes: '' })
  const [editId, setEditId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersApi.getCustomers({ page, page_size: 20, search: search || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.createSuccess'))
      setShowForm(false)
      setForm({ full_name: '', phone: '', email: '', address: '', notes: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customersApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.updateSuccess'))
      setShowForm(false)
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.deleteSuccess'))
      setDeleteId(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) {
      updateMutation.mutate({ id: editId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const openEdit = (item: any) => {
    setForm({ full_name: item.full_name, phone: item.phone, email: item.email || '', address: item.address || '', notes: item.notes || '' })
    setEditId(item.id)
    setShowForm(true)
  }

  const columns: Column<any>[] = [
    { key: 'full_name', label: t('customers.customerName'), sortable: true, render: (item) => <p className="font-medium text-gray-900 dark:text-white">{item.full_name}</p> },
    { key: 'phone', label: t('customers.customerPhone'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.phone}</span> },
    { key: 'total_spent', label: t('customers.totalSpent'), sortable: true, render: (item) => <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total_spent)}</span> },
    { key: 'total_orders', label: t('customers.totalOrders'), render: (item) => <span>{item.total_orders}</span> },
    { key: 'debt_amount', label: t('customers.debtAmount'), render: (item) => <span className={item.debt_amount > 0 ? 'text-red-600 font-medium' : ''}>{formatCurrency(item.debt_amount)}</span> },
    { key: 'is_active', label: t('common.status'), render: (item) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{item.is_active ? t('common.active') : t('common.inactive')}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers.title')}
        action={
          <Button onClick={() => { setForm({ full_name: '', phone: '', email: '', address: '', notes: '' }); setEditId(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('customers.addCustomer')}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('customers.searchCustomers')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/customers/${item.id}`)}
        actions={(item) => (
          <>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${item.id}`) }}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(item) }}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <DialogHeader onClose={() => setShowForm(false)}>
          <DialogTitle>{editId ? t('customers.editCustomer') : t('customers.addCustomer')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <Input label={t('customers.customerName')} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label={t('customers.customerPhone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input label={t('customers.customerEmail')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label={t('customers.customerAddress')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Textarea label={t('customers.customerNotes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? t('common.processing') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title={t('customers.confirmDelete')} loading={deleteMutation.isPending} />
    </div>
  )
}
