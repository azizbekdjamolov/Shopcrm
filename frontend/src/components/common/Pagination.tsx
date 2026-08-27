import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  const delta = 2
  const left = page - delta
  const right = page + delta

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-between">
      {totalItems !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalItems} records
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
