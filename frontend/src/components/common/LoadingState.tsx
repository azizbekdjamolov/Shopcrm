import { Loader2 } from 'lucide-react'

export function LoadingState({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      {text && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  )
}
