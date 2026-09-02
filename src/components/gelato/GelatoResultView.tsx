'use client'

import type { GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'
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

/** 水份／固形物比例 — same shape as the Sorbet 配方分析 table. */
export function GelatoBreakdownTable({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  const b = recipe.breakdown
  return (
    <Table>
      <THead>
        <TR>
          <TH>項目</TH>
          <TH className="text-right">重量</TH>
          <TH className="text-right">比例</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>水分</TD>
          <TD className="tabular text-right">{fmt(b.waterG)} g</TD>
          <TD className="tabular text-right">{fmt(b.waterPct)}%</TD>
        </TR>
        <TR>
          <TD>糖分</TD>
          <TD className="tabular text-right">{fmt(b.sugarG)} g</TD>
          <TD className="tabular text-right">{fmt(b.sugarPct)}%</TD>
        </TR>
        <TR>
          <TD>其他固形物</TD>
          <TD className="tabular text-right">{fmt(b.otherSolidsG)} g</TD>
          <TD className="tabular text-right">{fmt(b.otherSolidsPct)}%</TD>
        </TR>
        <TR className="border-b-0">
          <TD className="font-display border-t-2 pt-4 text-lg" style={{ borderColor: 'var(--wine)' }}>
            總固形物
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
            {fmt(b.totalSolidsG)} g
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
            {fmt(b.totalSolidsPct)}%
          </TD>
        </TR>
      </TBody>
    </Table>
  )
}

/** 總 POD / 總 PAC / 每 1000g / 建議儲存溫度 — mirrors the Sorbet PodPacSummary. */
export function GelatoPodPacSummary({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  const storage = estimateStorageTemp(recipe.pacPer1000g)
  const tile = (label: string, value: string) => (
    <div className="flex flex-col gap-1">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  )
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {tile('總 POD', fmt(recipe.podTotal))}
        {tile('總 PAC', fmt(recipe.pacTotal))}
        {tile('每 1000g POD', fmt(recipe.podPer1000g))}
        {tile('每 1000g PAC', fmt(recipe.pacPer1000g))}
      </div>
      <div
        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 pl-4"
        style={{ borderColor: 'var(--accent)' }}
      >
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          建議儲存溫度
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {formatStorageTemp(storage)}
        </span>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>
          參考表 {storage.band}
        </span>
      </div>
    </div>
  )
}
