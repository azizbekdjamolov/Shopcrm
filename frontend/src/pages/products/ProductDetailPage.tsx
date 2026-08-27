import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Barcode, Edit, Printer } from 'lucide-react'
import { productsApi } from '@/api/products'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!product) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.barcode}
        actions={[
          <Button key="back" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>,
          <Button key="edit" onClick={() => navigate(`/products/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('products.productDetail')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.productName')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.barcode')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{product.barcode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.barcode')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{product.barcode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.category')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{product.category?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.costPrice')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(product.purchase_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.sellingPrice')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(product.selling_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.currentStock')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{product.stock_quantity}</p>
                  {product.stock_quantity <= product.min_stock && (
                    <StatusBadge status={product.stock_quantity === 0 ? 'outOfStock' : 'lowStock'} />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.status')}</p>
                <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.description')}</p>
                <p className="mt-1 text-gray-900 dark:text-white">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.currentStock')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.stock_quantity}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.minStock')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.min_stock}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.unit')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.unit}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.taxRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.tax_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Card */}
      {product.barcode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              {t('products.barcode', 'Barcode')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg border border-gray-200 bg-white px-8 py-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="font-mono text-2xl font-bold tracking-wider text-gray-900">{product.barcode}</p>
              </div>
              <p className="text-sm text-gray-500">{product.barcode}</p>
              <Button
                variant="outline"
                onClick={() => {
                  const w = window.open('', '_blank', 'width=400,height=300')
                  if (w) {
                    w.document.write(`
                      <html><head><title>Label</title>
                      <style>body{font-family:monospace;text-align:center;padding:20px}h2{margin:0 0 8px}p{margin:4px 0;font-size:12px}.barcode{font-size:24px;font-weight:bold;letter-spacing:4px;margin:12px 0}</style>
                      </head><body>
                      <h2>${product.name}</h2>
                      <p>${product.category_name || ''}</p>
                      <div class="barcode">${product.barcode}</div>
                      <p>${formatCurrency(product.selling_price)}</p>
                      </body></html>
                    `)
                    w.document.close()
                    w.print()
                  }
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('products.printLabel', 'Print Label')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
