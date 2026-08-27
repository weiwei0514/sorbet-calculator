import type { ReactNode } from 'react'

interface SectionProps {
  eyebrow: string
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ eyebrow, title, action, children }: SectionProps) {
  return (
    <section className="border-t pt-10" style={{ borderColor: 'var(--rule)' }}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-label mb-2 text-[10px]" style={{ color: 'var(--gold)' }}>
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl font-medium" style={{ color: 'var(--ink)' }}>
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
