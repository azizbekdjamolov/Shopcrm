import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const avatarSizes: Record<string, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700 font-medium dark:bg-primary-900/30 dark:text-primary-300',
        avatarSizes[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
