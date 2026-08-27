import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '')

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange?.(value)
    }, debounceMs),
    [onChange, debounceMs]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInternalValue(value)
    debouncedOnChange(value)
  }

  return (
    <div className={cn('relative max-w-sm', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
