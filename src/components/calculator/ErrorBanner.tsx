import type { ValidationError } from '@/lib/calculator/types'

export function ErrorBanner({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <p className="mb-2 font-medium">目前設定無法產生有效配方：</p>
      <ul className="list-inside list-disc space-y-1">
        {errors.map((e, i) => (
          <li key={`${e.field}-${i}`}>{e.message}</li>
        ))}
      </ul>
    </div>
  )
}
