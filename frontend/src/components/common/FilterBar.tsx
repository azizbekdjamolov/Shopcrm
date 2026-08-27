import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'

interface FilterBarProps {
  children?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function FilterBar({ children, searchValue, onSearchChange, searchPlaceholder }: FilterBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {onSearchChange && (
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder || t('common.search') + '...'}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      )}
      {children}
    </div>
  )
}
