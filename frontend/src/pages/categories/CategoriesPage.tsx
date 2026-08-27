import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react'
import { productsApi } from '@/api/products'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

export function CategoriesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.getCategories()
      return Array.isArray(res) ? res : (res as any)?.results || []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      editingId ? productsApi.updateCategory(editingId, data) : productsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editingId ? t('common.success') : t('common.success'))
      setShowDialog(false)
      setEditingId(null)
      setName('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('common.success'))
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('categories.title', 'Categories')}
        action={
          <Button onClick={() => { setEditingId(null); setName(''); setShowDialog(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.addCategory', 'Add Category')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(categories || []).map((cat: any) => (
          <Card key={cat.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FolderTree className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.product_count || 0} {t('products.title')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditingId(cat.id); setName(cat.name); setShowDialog(true) }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm(t('common.areYouSure'))) deleteMutation.mutate(cat.id)
                }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && (!categories || categories.length === 0) && (
        <div className="py-12 text-center text-gray-500">
          <FolderTree className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>{t('common.noData')}</p>
        </div>
      )}

      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogHeader onClose={() => setShowDialog(false)}>
          <DialogTitle>{editingId ? t('common.edit') : t('common.create')} {t('categories.title', 'Category')}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <Input
            label={t('categories.name', 'Category Name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => createMutation.mutate({ name })} disabled={!name.trim() || createMutation.isPending}>
            {createMutation.isPending ? t('common.processing') : t('common.save')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
