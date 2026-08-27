import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Store, Truck, Save } from 'lucide-react'
import { businessesApi } from '@/api/businesses'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/common/LoadingState'
import toast from 'react-hot-toast'

export function MarketplaceSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: businessesApi.getMarketplaceSettings,
  })

  const [form, setForm] = useState({
    is_public: false,
    delivery_enabled: false,
    delivery_fee: 0,
    min_order_amount: 0,
    store_description: '',
    store_phone: '',
    store_address: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        is_public: settings.is_public,
        delivery_enabled: settings.delivery_enabled,
        delivery_fee: Number(settings.delivery_fee),
        min_order_amount: Number(settings.min_order_amount),
        store_description: settings.store_description || '',
        store_phone: settings.store_phone || '',
        store_address: settings.store_address || '',
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: businessesApi.updateMarketplaceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-settings'] })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.marketplace', 'Marketplace Settings')}
        action={
          <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? t('common.processing') : t('common.save')}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t('settings.storeVisibility', 'Store Visibility')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.publicStore', 'Public Store')}</p>
                <p className="text-sm text-gray-500">{t('settings.publicStoreDesc', 'Show your store in the public marketplace')}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_public: !form.is_public })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_public ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_public ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>

            <Input
              label={t('settings.storeDescription', 'Store Description')}
              value={form.store_description}
              onChange={(e) => setForm({ ...form, store_description: e.target.value })}
              placeholder={t('settings.storeDescriptionPlaceholder', 'Describe your store...')}
            />
            <Input
              label={t('settings.storePhone', 'Store Phone')}
              value={form.store_phone}
              onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
              placeholder="+998 90 123 4567"
            />
            <Input
              label={t('settings.storeAddress', 'Store Address')}
              value={form.store_address}
              onChange={(e) => setForm({ ...form, store_address: e.target.value })}
              placeholder={t('settings.storeAddressPlaceholder', 'Tashkent, Amir Temur str.')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t('settings.deliveryConfig', 'Delivery Configuration')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('settings.enableDelivery', 'Enable Delivery')}</p>
                <p className="text-sm text-gray-500">{t('settings.enableDeliveryDesc', 'Allow customers to order delivery')}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, delivery_enabled: !form.delivery_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.delivery_enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.delivery_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>

            <Input
              label={t('settings.deliveryFee', 'Delivery Fee (UZS)')}
              type="number"
              value={form.delivery_fee}
              onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
              min={0}
            />
            <Input
              label={t('settings.minOrderAmount', 'Minimum Order Amount (UZS)')}
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
              min={0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
