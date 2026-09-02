'use client'

import type { GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

const ROLE_LABEL: Record<GelatoRecipeSnapshot['components'][number]['role'], string> = {
  step1: 'Step 1',
  free: '新增',
  base: '基礎乳製品',
}

export function GelatoRecipeTable({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  const rows = recipe.components.filter((c) => Math.abs(c.weightG) > 0.05)
  return (
    <Table>
      <THead>
        <TR>
          <TH>材料</TH>
          <TH className="text-right">重量</TH>
          <TH className="text-right">%</TH>
          <TH>來源</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((c) => (
          <TR key={`${c.role}-${c.ingredientId}`}>
            <TD>{c.name}</TD>
            <TD className="tabular text-right">{fmt(c.weightG)} g</TD>
            <TD className="tabular text-right">{fmt(c.pctOfTotal, 2)}%</TD>
            <TD className="text-xs" style={{ color: 'var(--faint)' }}>
              {ROLE_LABEL[c.role]}
            </TD>
          </TR>
        ))}
        <TR className="border-b-0">
          <TD className="font-display border-t-2 pt-4 text-lg" style={{ borderColor: 'var(--wine)' }}>
            總計
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
            {fmt(recipe.totalWeightG)} g
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
            100.00%
          </TD>
          <TD className="border-t-2 pt-4" style={{ borderColor: 'var(--wine)' }}>
            {''}
          </TD>
        </TR>
      </TBody>
    </Table>
  )
}

export function GelatoAnalysis({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  return (
    <div className="flex flex-col gap-3">
      {recipe.metrics.map((m) => {
        const ok = m.inRange
        const rangeText = m.range ? `${m.range.min}–${m.range.max}` : '—'
        return (
          <div
            key={m.key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2"
            style={{ borderColor: 'var(--rule)' }}
          >
            <span className="text-sm" style={{ color: 'var(--ink)' }}>
              {m.label}
            </span>
            <span className="flex items-baseline gap-3">
              <span className="tabular text-sm" style={{ color: 'var(--ink)' }}>
                {m.value == null ? '—' : `${fmt(m.value, 2)}%`}
              </span>
              <span
                className="font-mono-label text-[10px]"
                style={{ color: m.range == null ? 'var(--faint)' : ok ? 'var(--ok)' : 'var(--danger)' }}
              >
                {m.range == null ? rangeText : ok ? `✓ ${rangeText}` : `✗ ${rangeText}`}
              </span>
            </span>
          </div>
        )
      })}

      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-xs" style={{ color: 'var(--faint)' }}>
        <span>總 POD {fmt(recipe.podTotal)}</span>
        <span>總 PAC {fmt(recipe.pacTotal)}</span>
        <span>水分 {fmt(recipe.waterPct, 2)}%</span>
      </div>
    </div>
  )
}
