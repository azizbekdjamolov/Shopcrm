import { useState, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>({ value: '', onValueChange: () => {} })

function Tabs({ defaultValue, children, className }: { defaultValue: string; children: ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 mb-4', className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)
  const isActive = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn('', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
