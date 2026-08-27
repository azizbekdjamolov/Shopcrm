import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Eye, Plus, Download } from 'lucide-react'
import { invoicesApi } from '@/api/invoices'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function InvoicesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ description: '', quantity: 1, unit_price: 0 })

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search],
    queryFn: () => invoicesApi.getInvoices({ page, page_size: 20 }),
  })

  const createMutation = useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(t('invoices.createSuccess'))
      setShowCreate(false)
      setForm({ description: '', quantity: 1, unit_price: 0 })
    },
    onError: () => toast.error(t('common.error')),
  })

  const columns: Column<any>[] = [
    { key: 'invoice_number', label: t('invoices.invoiceNumber'), render: (item) => <span className="font-medium text-primary-600">#{item.invoice_number}</span> },
    { key: 'customer', label: t('invoices.customer'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.customer?.full_name || '-'}</span> },
    { key: 'total_amount', label: t('invoices.totalAmount'), sortable: true, render: (item) => <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.total_amount)}</span> },
    { key: 'status', label: t('invoices.status'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'created_at', label: t('common.date'), sortable: true, render: (item) => <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('invoices.title')} action={
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />{t('invoices.createInvoice')}</Button>
      } />
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('invoices.searchInvoices')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="icon" onClick={() => toast.success(t('invoices.viewing'))}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}><DialogTitle>{t('invoices.createInvoice')}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ items: [{ description: form.description, quantity: form.quantity, unit_price: form.unit_price }] }) }}>
          <DialogContent className="space-y-4">
            <Input label={t('invoices.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <Input label={t('invoices.quantity')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
            <Input label={t('invoices.unitPrice')} type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} required />
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending}>{t('common.create')}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
