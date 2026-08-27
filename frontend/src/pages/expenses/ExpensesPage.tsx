import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { expensesApi } from '@/api/expenses'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ExpensesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ category_id: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] })

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search],
    queryFn: () => expensesApi.getExpenses({ page, page_size: 20, search: search || undefined }),
  })

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: expensesApi.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success(t('expenses.createSuccess')); setShowForm(false); setForm({ category_id: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => expensesApi.updateExpense(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success(t('expenses.updateSuccess')); setShowForm(false); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success(t('expenses.deleteSuccess')); setDeleteId(null) },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) updateMutation.mutate({ id: editId, data: form })
    else createMutation.mutate(form as any)
  }

  const openEdit = (item: any) => {
    setForm({ category_id: item.category_id, amount: item.amount, description: item.description, date: item.date })
    setEditId(item.id)
    setShowForm(true)
  }

  const columns: Column<any>[] = [
    { key: 'description', label: t('common.description'), render: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.description}</span> },
    { key: 'category', label: t('expenses.expenseCategory'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.category?.name || '-'}</span> },
    { key: 'amount', label: t('common.amount'), sortable: true, render: (item) => <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span> },
    { key: 'date', label: t('common.date'), sortable: true, render: (item) => <span className="text-gray-500">{new Date(item.date).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('expenses.title')} action={
        <Button onClick={() => { setForm({ category_id: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); setEditId(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />{t('expenses.addExpense')}
        </Button>
      } />
      <DataTable columns={columns} data={data?.items || []} isLoading={isLoading} searchPlaceholder={t('expenses.searchExpenses')} onSearch={setSearch} page={page} totalPages={data?.total_pages || 1} totalItems={data?.total || 0} onPageChange={setPage}
        actions={(item) => (
          <>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(item) }}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </>
        )} />

      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <DialogHeader onClose={() => setShowForm(false)}><DialogTitle>{editId ? t('expenses.editExpense') : t('expenses.addExpense')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <Select label={t('expenses.expenseCategory')} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              options={(categories || []).map((c) => ({ value: c.id, label: c.name }))} placeholder={t('expenses.addCategory')} />
            <Input label={t('common.amount')} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            <Textarea label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={2} />
            <Input label={t('common.date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? t('common.processing') : t('common.save')}</Button>
          </DialogFooter>
        </form>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  )
}
