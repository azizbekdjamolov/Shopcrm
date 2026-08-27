import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { productsApi, type ProductFilters } from '@/api/products'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.getProducts({ page, page_size: 20, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('products.deleteSuccess'))
      setDeleteId(null)
    },
  })

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: t('products.productName'),
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img src={item.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="text-xs font-medium text-gray-500">{item.name?.[0]}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.barcode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: t('products.category'),
      render: (item) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {item.category?.name || '-'}
        </span>
      ),
    },
    {
      key: 'selling_price',
      label: t('products.sellingPrice'),
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(item.selling_price)}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      label: t('products.currentStock'),
      sortable: true,
      render: (item) => {
        const isLow = item.stock_quantity <= item.min_stock
        const isOut = item.stock_quantity === 0
        return (
          <div className="flex items-center gap-2">
            <span className={isOut ? 'text-red-600 dark:text-red-400' : isLow ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}>
              {item.stock_quantity}
            </span>
            {isLow && !isOut && <StatusBadge status="lowStock" />}
            {isOut && <StatusBadge status="outOfStock" />}
          </div>
        )
      },
    },
    {
      key: 'is_active',
      label: t('common.status'),
      render: (item) => (
        <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('products.title')}
        action={
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('products.searchProducts')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/products/${item.id}`)}
        actions={(item) => (
          <>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}`) }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}/edit`) }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('products.confirmDelete')}
        message={t('common.deleteMessage')}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
