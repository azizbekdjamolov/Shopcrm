import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, CheckCircle, XCircle, Shield } from 'lucide-react'
import api from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const res = await api.get('/platform-admin/users/', { params: { page, page_size: 20, search: search || undefined } })
      return res.data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => { const res = await api.patch(`/platform-admin/users/${id}/toggle/`); return res.data },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success(t('common.success')) },
  })

  const columns: Column<any>[] = [
    { key: 'email', label: t('auth.email'), render: (item) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{item.email}</p>
        <p className="text-xs text-gray-500">{item.first_name} {item.last_name}</p>
      </div>
    )},
    { key: 'role', label: t('employees.role', 'Role'), render: (item) => (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
        {item.is_platform_admin && <Shield className="h-3 w-3 text-amber-500" />}
        {item.role}
      </span>
    )},
    { key: 'is_active', label: t('common.status'), render: (item) => <StatusBadge status={item.is_active ? 'active' : 'inactive'} /> },
    { key: 'date_joined', label: t('common.date'), render: (item) => <span className="text-sm text-gray-500">{item.date_joined ? new Date(item.date_joined).toLocaleDateString() : '-'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.users', 'Users')} />
      <DataTable
        columns={columns}
        data={data?.items || data || []}
        isLoading={isLoading}
        searchPlaceholder={t('admin.searchUsers', 'Search users...')}
        onSearch={setSearch}
        page={page}
        totalPages={data?.total_pages || 1}
        totalItems={data?.total || 0}
        onPageChange={setPage}
        actions={(item) => (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(item.id) }}>
            {item.is_active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
          </Button>
        )}
      />
    </div>
  )
}
