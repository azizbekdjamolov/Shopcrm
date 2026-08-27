import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { employeesApi } from '@/api/employees'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart } from '@/components/common/Charts'
import { formatCurrency } from '@/lib/utils'

export function EmployeeDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.getEmployee(id!),
    enabled: !!id,
  })

  const { data: performance } = useQuery({
    queryKey: ['employee-performance', id],
    queryFn: () => employeesApi.getPerformance(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!employee) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.user?.full_name || t('employees.title')}
        description={employee.position}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{t('common.back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('employees.position')}</p>
            <p className="font-bold text-gray-900 dark:text-white">{employee.position}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('employees.salary')}</p>
            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(employee.salary)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('employees.performanceScore')}</p>
            <p className="font-bold text-primary-600">{performance?.score || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">{t('employees.attendanceRate')}</p>
            <p className="font-bold text-green-600">{performance?.attendance_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('employees.salesTrend')}</CardTitle></CardHeader>
          <CardContent>
            {performance?.sales_trend?.length ? (
              <LineChart data={performance.sales_trend} xKey="date" yKey="amount" height={250} />
            ) : (
              <p className="py-4 text-center text-gray-500">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('employees.monthlyPerformance')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('employees.totalSales')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(performance?.total_sales || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('employees.totalOrders')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{performance?.total_orders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('employees.averageOrderValue')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(performance?.average_order_value || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
