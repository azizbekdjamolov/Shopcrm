import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({
  children,
  onClick,
  className,
  danger,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
        danger ? 'text-red-600 hover:text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
        className
      )}
    >
      {children}
    </button>
  )
}

function DropdownSeparator() {
  return <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
}

export { Dropdown, DropdownItem, DropdownSeparator }
