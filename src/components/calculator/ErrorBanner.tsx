import type { ValidationError } from '@/lib/calculator/types'

export function ErrorBanner({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null

  return (
    <div className="border-l-2 py-1 pl-6" style={{ borderColor: 'var(--danger)' }}>
      <p className="font-mono-label mb-3 text-[10px]" style={{ color: 'var(--danger)' }}>
        Unable to Balance · 目前設定無法產生有效配方
      </p>
      <ul className="space-y-1.5 text-sm" style={{ color: 'var(--muted)' }}>
        {errors.map((e, i) => (
          <li key={`${e.field}-${i}`}>{e.message}</li>
        ))}
      </ul>
    </div>
  )
}
