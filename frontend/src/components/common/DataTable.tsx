import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  searchPlaceholder?: string
  searchKey?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  actions?: (item: T) => React.ReactNode
  onRowClick?: (item: T) => void
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  searchPlaceholder,
  searchKey,
  emptyTitle,
  emptyDescription,
  emptyAction,
  page = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  onSearch,
  actions,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!data.length && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {emptyTitle || t('common.noData')}
        </p>
        {emptyDescription && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {emptyDescription}
          </p>
        )}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(searchKey || onSearch) && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder || t('common.search') + '...'}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400',
                      col.sortable && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    'border-b border-gray-100 last:border-0 dark:border-gray-800',
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-gray-900 dark:text-gray-100', col.className)}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.showing')} {((page - 1) * 20) + 1}-{Math.min(page * 20, totalItems)} {t('common.of')} {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
