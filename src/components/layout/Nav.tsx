'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calculator, FlaskConical, BookMarked } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '計算機', icon: Calculator },
  { href: '/ingredients', label: '食材資料庫', icon: FlaskConical },
  { href: '/saved', label: '已儲存配方', icon: BookMarked },
]

export function Nav() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden shrink-0 md:flex md:w-56 md:flex-col md:border-r"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="px-6 py-8">
          <p className="font-mono-label text-[10px]" style={{ color: 'var(--accent)' }}>
            Sorbet Recipe Engine
          </p>
          <p className="font-display text-2xl" style={{ color: 'var(--wine)' }}>
            Sorbet
          </p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors"
                style={{
                  borderColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t md:hidden"
        style={{ borderColor: 'var(--rule)', background: 'var(--bg)' }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px]"
              style={{ color: active ? 'var(--accent)' : 'var(--faint)' }}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
