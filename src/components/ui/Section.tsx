import type { ReactNode } from 'react'

interface SectionProps {
  eyebrow: string
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ eyebrow, title, action, children }: SectionProps) {
  return (
    <section className="border-t pt-8 sm:pt-10" style={{ borderColor: 'var(--rule)' }}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="font-mono-label mb-2 text-[10px]" style={{ color: 'var(--gold)' }}>
            {eyebrow}
          </p>
          <h2 className="font-display text-2xl font-medium sm:text-3xl" style={{ color: 'var(--ink)' }}>
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
