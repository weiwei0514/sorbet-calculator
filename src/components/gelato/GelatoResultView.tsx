'use client'

import type { GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

const ROLE_LABEL: Record<GelatoRecipeSnapshot['components'][number]['role'], string> = {
  step1: 'STEP 1',
  flavour: '風味',
  fixed: '固定',
  base: '基底',
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
            TOTAL
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
    <div className="flex flex-col gap-2.5">
      {recipe.metrics.map((m) => (
        <div
          key={m.key}
          className="flex items-baseline justify-between border-b pb-1.5 text-sm"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span style={{ color: 'var(--ink)' }}>{m.label}</span>
          <span className="tabular" style={{ color: 'var(--ink)' }}>
            {m.unit === '%' ? `${fmt(m.value, 2)}%` : fmt(m.value, 2)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function GelatoFormulaCheck({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          GELATO FORMULA CHECK
        </span>
        <span
          className="font-mono-label rounded px-2 py-1 text-[10px]"
          style={{
            background: recipe.overallPass ? 'var(--ok)' : 'var(--danger)',
            color: '#fff',
          }}
        >
          {recipe.overallPass ? '✅ FORMULA PASS' : '❌ FORMULA FAIL'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {recipe.step0.map((c) => (
          <div
            key={c.key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-1.5 text-sm"
            style={{ borderColor: 'var(--rule)' }}
          >
            <span style={{ color: 'var(--ink)' }}>{c.label}</span>
            <span className="flex items-baseline gap-3">
              <span className="tabular" style={{ color: 'var(--ink)' }}>
                {fmt(c.actual, 2)}%
              </span>
              <span className="tabular text-xs" style={{ color: 'var(--faint)' }}>
                {c.range.min}–{c.range.max}%
              </span>
              <span
                className="font-mono-label text-[10px]"
                style={{ color: c.pass ? 'var(--ok)' : 'var(--danger)' }}
              >
                {c.pass ? '✅' : `❌ 超出 ${fmt(c.overBy, 2)}%`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
