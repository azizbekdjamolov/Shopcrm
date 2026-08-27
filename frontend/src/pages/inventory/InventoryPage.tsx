import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Warehouse, AlertTriangle } from 'lucide-react'
import { inventoryApi } from '@/api/inventory'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function InventoryPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search],
    queryFn: () => inventoryApi.getInventory({ page, page_size: 20, search: search || undefined }),
  })

  const { data: lowStock } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
  })

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: () => inventoryApi.getMovements({ page: 1, page_size: 20 }),
  })

  const columns: Column<any>[] = [
    {
      key: 'product',
      label: t('products.productName'),
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.product?.name || '-'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.product?.barcode}</p>
        </div>
      ),
    },
    {
      key: 'branch',
      label: t('branches.title'),
      render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.branch?.name || '-'}</span>,
    },
    { key: 'quantity', label: t('inventory.stockLevel'), render: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span> },
    { key: 'reserved_quantity', label: t('inventory.reserved'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{item.reserved_quantity}</span> },
    { key: 'available_quantity', label: t('inventory.available'), render: (item) => <span className="font-medium text-green-600 dark:text-green-400">{item.available_quantity}</span> },
  ]

  const movementColumns: Column<any>[] = [
    { key: 'product', label: t('products.productName'), render: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.product?.name || '-'}</span> },
    { key: 'type', label: t('inventory.movementType'), render: (item) => <StatusBadge status={item.type} /> },
    { key: 'quantity', label: t('inventory.quantityChange'), render: (item) => <span className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.quantity > 0 ? '+' : ''}{item.quantity}</span> },
    { key: 'created_at', label: t('common.date'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{new Date(item.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('inventory.title')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('inventory.stockLevel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('inventory.lowStockAlerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{lowStock?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('inventory.movements')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{movements?.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">{t('inventory.overview')}</TabsTrigger>
          <TabsTrigger value="movements">{t('inventory.movements')}</TabsTrigger>
          <TabsTrigger value="lowStock">{t('inventory.lowStockAlerts')}</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            searchPlaceholder={t('inventory.searchInventory')}
            onSearch={setSearch}
            page={page}
            totalPages={data?.total_pages || 1}
            totalItems={data?.total || 0}
            onPageChange={setPage}
          />
        </TabsContent>
        <TabsContent value="movements">
          <DataTable columns={movementColumns} data={movements?.items || []} isLoading={movementsLoading} />
        </TabsContent>
        <TabsContent value="lowStock">
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.stock_quantity} / {product.min_stock}</p>
                    <StatusBadge status={product.stock_quantity === 0 ? 'outOfStock' : 'lowStock'} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">{t('inventory.allClear')}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
