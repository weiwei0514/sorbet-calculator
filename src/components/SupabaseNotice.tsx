interface SupabaseNoticeProps {
  variant: 'warning' | 'error'
  message: string
  title?: string
}

export function SupabaseNotice({ variant, message, title }: SupabaseNoticeProps) {
  const color = variant === 'error' ? 'var(--danger)' : 'var(--accent)'
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      {title && (
        <h1 className="font-display text-3xl font-medium sm:text-4xl" style={{ color: 'var(--wine)' }}>
          {title}
        </h1>
      )}
      <p className="border-l-2 pl-6 text-sm" style={{ borderColor: color, color: 'var(--muted)' }}>
        {message}
      </p>
    </div>
  )
}
