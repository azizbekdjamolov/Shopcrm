import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  actions?: ReactNode[]
}

export function PageHeader({ title, description, action, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions?.map((a, i) => <div key={i}>{a}</div>)}
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
