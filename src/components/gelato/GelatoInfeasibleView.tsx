'use client'

import type { GelatoResult } from '@/lib/gelato/types'
import { GelatoAnalysis, GelatoRecipeTable } from './GelatoResultView'

function fmt(n: number, digits = 2) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function GelatoInfeasibleView({
  result,
}: {
  result: Extract<GelatoResult, { reason: 'infeasible' }>
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-l-2 py-1 pl-6" style={{ borderColor: 'var(--danger)' }}>
        <p className="font-mono-label mb-3 text-[10px]" style={{ color: 'var(--danger)' }}>
          No Feasible Solution · 目前條件無可行解
        </p>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
          {result.violations.map((v) => (
            <li key={v.key}>
              <span style={{ color: 'var(--ink)' }}>{v.label}</span>：最接近可行解為{' '}
              <span className="tabular">{fmt(v.achieved)}%</span>（{v.direction}），允許範圍{' '}
              <span className="tabular">
                {v.range.min}–{v.range.max}%
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          {result.hint}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          Closest Feasible · 最接近可行解（僅供參考）
        </p>
        <GelatoRecipeTable recipe={result.closest} />
        <GelatoAnalysis recipe={result.closest} />
      </div>
    </div>
  )
}
