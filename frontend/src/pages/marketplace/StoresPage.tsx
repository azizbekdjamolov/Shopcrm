import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Store, Search, Truck, Star, Package } from 'lucide-react'
import api from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/common/LoadingState'
import { formatCurrency } from '@/lib/utils'

async function fetchStores(params?: { search?: string; category?: string }) {
  const response = await api.get('/marketplace/stores/', { params })
  const data = response.data
  return Array.isArray(data) ? data : data?.data || []
}

export function StoresPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: stores, isLoading } = useQuery({
    queryKey: ['marketplace', 'stores', search],
    queryFn: () => fetchStores({ search: search || undefined }),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white shadow-sm dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Business OS</h1>
                <p className="text-sm text-gray-500">{t('marketplace.subtitle', 'Discover stores near you')}</p>
              </div>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('marketplace.searchStores', 'Search stores...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState />
        ) : !stores?.length ? (
          <div className="py-16 text-center">
            <Store className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">{t('marketplace.noStores', 'No stores found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(stores || []).map((store: any) => (
              <Card key={store.id} className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1" onClick={() => navigate(`/stores/${store.id}`)}>
                <CardContent className="p-0">
                  <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-xl flex items-center justify-center">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                      <Store className="h-16 w-16 text-white/80" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{store.name}</h3>
                    {store.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{store.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {store.product_count} {t('marketplace.products', 'products')}
                      </span>
                      {store.is_delivery_enabled && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Truck className="h-3.5 w-3.5" />
                          {t('marketplace.delivery', 'Delivery')}
                        </span>
                      )}
                    </div>
                    {store.address && (
                      <p className="mt-2 text-xs text-gray-400 truncate">{store.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
