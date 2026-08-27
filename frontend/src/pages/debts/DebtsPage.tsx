import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, DollarSign } from 'lucide-react'
import { debtsApi } from '@/api/debts'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { PaymentMethod, DebtStatus } from '@/types'
import toast from 'react-hot-toast'

export function DebtsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payId, setPayId] = useState<string | null>(null)
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: PaymentMethod.CASH, notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['debts', page, search, statusFilter],
    queryFn: () => debtsApi.getDebts({ page, page_size: 20, search: search || undefined, status: statusFilter || undefined }),
  })

  const payMutation = useMutation({
    mutationFn: ({ id, ...form }: { id: string; amount: number; payment_method: string; notes?: string }) => debtsApi.makePayment(id, form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      toast.success(t('debts.paymentSuccess'))
      setPayId(null)
    },
    onError: () => toast.error(t('debts.paymentFailed')),
  })

  const columns: Column<any>[] = [
    { key: 'customer', label: t('customers.customerName'), render: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.customer?.full_name || '-'}</span> },
    { key: 'original_amount', label: t('debts.originalAmount'), render: (item) => <span className="text-gray-600 dark:text-gray-300">{formatCurrency(item.original_amount)}</span> },
    { key: 'paid_amount', label: t('debts.paidAmount'), render: (item) => <span className="text-green-600">{formatCurrency(item.paid_amount)}</span> },
    { key: 'remaining_amount', label: t('debts.remainingAmount'), render: (item) => <span className="font-medium text-red-600">{formatCurrency(item.remaining_amount)}</span> },
    { key: 'status', label: t('debts.debtStatus'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'due_date', label: t('debts.dueDate'), render: (item) => <span className="text-gray-500">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('debts.title')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <Wallet className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{data?.total || 0}</p>
          <p className="text-sm text-gray-500">{t('debts.activeDebts')}</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', ...Object.values(DebtStatus)].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
            {s ? t(`debts.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        searchPlaceholder={t('debts.searchDebts')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => item.status !== 'paid' && item.status !== 'written_off' ? (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setPayId(item.id); setPayForm({ amount: item.remaining_amount, payment_method: PaymentMethod.CASH, notes: '' }) }}>
            <DollarSign className="mr-1 h-3 w-3" />{t('debts.makePayment')}
          </Button>
        ) : null}
      />

      <Dialog open={!!payId} onClose={() => setPayId(null)}>
        <DialogHeader onClose={() => setPayId(null)}><DialogTitle>{t('debts.makePayment')}</DialogTitle></DialogHeader>
        <DialogContent className="space-y-4">
          <Input label={t('common.amount')} type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
          <Select label={t('sales.paymentMethod')} value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value as any })}
            options={Object.values(PaymentMethod).map((m) => ({ value: m, label: m }))} />
          <Input label={t('common.description')} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPayId(null)}>{t('common.cancel')}</Button>
          <Button onClick={() => payId && payMutation.mutate({ id: payId, ...payForm })} disabled={payMutation.isPending}>
            {payMutation.isPending ? t('common.processing') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
