import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react'
import { expensesApi } from '@/api/expenses'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { LoadingState } from '@/components/common/LoadingState'
import toast from 'react-hot-toast'

export function ExpenseCategoriesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: expensesApi.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; budget_limit?: number }) =>
      editingId ? expensesApi.updateCategory(editingId, data) : expensesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      toast.success(t('common.success'))
      setShowDialog(false)
      setEditingId(null)
      setName('')
      setDescription('')
      setBudgetLimit('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      toast.success(t('common.success'))
    },
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('expenses.categoryTitle', 'Expense Categories')}
        action={
          <Button onClick={() => { setEditingId(null); setName(''); setDescription(''); setBudgetLimit(''); setShowDialog(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('expenses.addCategory', 'Add Category')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(categories || []).map((cat: any) => (
          <Card key={cat.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FolderTree className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingId(cat.id); setName(cat.name); setDescription(cat.description || ''); setBudgetLimit(cat.budget_limit?.toString() || ''); setShowDialog(true) }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(t('common.areYouSure'))) deleteMutation.mutate(cat.id) }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <div className="py-12 text-center text-gray-500">
          <FolderTree className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>{t('common.noData')}</p>
        </div>
      )}

      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogHeader onClose={() => setShowDialog(false)}>
          <DialogTitle>{editingId ? t('common.edit') : t('common.create')} {t('expenses.category', 'Category')}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <Input label={t('expenses.categoryName', 'Category Name')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <Input label={t('expenses.description', 'Description')} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label={t('expenses.budgetLimit', 'Budget Limit')} type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => createMutation.mutate({ name, description: description || undefined, budget_limit: budgetLimit ? Number(budgetLimit) : undefined })} disabled={!name.trim() || createMutation.isPending}>
            {createMutation.isPending ? t('common.processing') : t('common.save')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
