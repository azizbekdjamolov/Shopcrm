import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: number
  changeLabel?: string
  className?: string
}

export function StatCard({ title, value, icon, change, changeLabel, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
          {icon}
        </div>
      </div>
    </div>
  )
}
