'use client'

import { STEP0_RANGES, STEP0_ROWS } from '@/lib/gelato/defaults'

/** STEP 0 — the fixed acceptance ranges. Read-only; the user can never change these. */
export function Step0Card() {
  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: 'var(--rule)', background: 'color-mix(in oklab, var(--accent) 4%, transparent)' }}
    >
      <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>
        最終配方必須落在以下固定範圍內。此標準不可修改，僅用於 STEP 3 的驗收。
      </p>
      <div className="flex flex-col gap-2">
        {STEP0_ROWS.map((row) => {
          const r = STEP0_RANGES[row.key]
          return (
            <div
              key={row.key}
              className="flex items-baseline justify-between border-b pb-1.5 text-sm"
              style={{ borderColor: 'var(--rule)' }}
            >
              <span style={{ color: 'var(--ink)' }}>{row.label}</span>
              <span className="tabular" style={{ color: 'var(--muted)' }}>
                {r.min}%–{r.max}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
