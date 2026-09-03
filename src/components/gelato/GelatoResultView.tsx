'use client'

import type { GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'
import { gelatoColor } from '@/lib/gelato/colors'
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

const MIN_LABEL_PCT = 12

/** Stacked proportion bar + legend — same visual language as the Sorbet CompositionBar. */
export function GelatoCompositionBar({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  const rows = recipe.components.filter((c) => Math.abs(c.weightG) > 0.05)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-6 gap-0.5 overflow-hidden rounded-[4px]">
        {rows.map((c, i) => (
          <div
            key={`${c.role}-${c.ingredientId}`}
            title={`${c.name} · ${fmt(c.weightG)}g · ${fmt(c.pctOfTotal, 2)}%`}
            className="flex h-full items-center justify-center overflow-hidden first:rounded-l-[4px] last:rounded-r-[4px]"
            style={{ width: `${c.pctOfTotal}%`, background: gelatoColor(i) }}
          >
            {c.pctOfTotal >= MIN_LABEL_PCT && (
              <span className="font-mono-label truncate px-1.5 text-[9px] text-white">{fmt(c.pctOfTotal)}%</span>
            )}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {rows.map((c, i) => (
          <li key={`${c.role}-${c.ingredientId}`} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: gelatoColor(i) }} />
            <span>{c.name}</span>
            <span className="tabular" style={{ color: 'var(--faint)' }}>
              {fmt(c.weightG)}g · {fmt(c.pctOfTotal, 2)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 逐項貢獻與計算過程 — every ingredient's sugar, POD and PAC contribution with the
 *  {weight × sugar-fraction × coefficient} working shown, like the Sorbet PodPacPanel. */
export function GelatoContributionTable({ recipe }: { recipe: GelatoRecipeSnapshot }) {
  const rows = recipe.components.filter((c) => Math.abs(c.weightG) > 0.05)
  return (
    <Table>
      <THead>
        <TR>
          <TH>原料</TH>
          <TH className="text-right">重量</TH>
          <TH className="text-right">糖量</TH>
          <TH className="text-right">POD貢獻</TH>
          <TH className="text-right">PAC貢獻</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((c) => {
          // Basis fraction shown in the working: sugar-fraction for most, the
          // fixed lactose-ish fraction for 牛奶 / 脫脂奶粉 / 動物性鮮奶油.
          const basisFraction = c.weightG > 0 ? c.podPacBasisG / c.weightG : 0
          return (
            <TR key={`${c.role}-${c.ingredientId}`}>
              <TD>{c.name}</TD>
              <TD className="tabular text-right">{fmt(c.weightG)} g</TD>
              <TD className="tabular text-right">{fmt(c.sugarG)} g</TD>
              <TD className="text-right">
                {c.podCoefficient == null ? (
                  <span style={{ color: 'var(--faint)' }}>尚未設定</span>
                ) : (
                  <div>
                    <div className="tabular">{fmt(c.podContributionG)}</div>
                    <div className="text-xs" style={{ color: 'var(--faint)' }}>
                      {fmt(c.weightG, 0)} × {fmt(basisFraction, 3)} × {fmt(c.podCoefficient, 2)}
                    </div>
                  </div>
                )}
              </TD>
              <TD className="text-right">
                {c.pacCoefficient == null ? (
                  <span style={{ color: 'var(--faint)' }}>尚未設定</span>
                ) : (
                  <div>
                    <div className="tabular">{fmt(c.pacContributionG)}</div>
                    <div className="text-xs" style={{ color: 'var(--faint)' }}>
                      {fmt(c.weightG, 0)} × {fmt(basisFraction, 3)} × {fmt(c.pacCoefficient, 2)}
                    </div>
                  </div>
                )}
              </TD>
            </TR>
          )
        })}
        <TR className="border-b-0">
          <TD className="border-t-2 pt-4 font-display text-base" style={{ borderColor: 'var(--wine)' }}>
            總計
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right" style={{ borderColor: 'var(--wine)' }}>
            {fmt(recipe.totalWeightG)} g
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right" style={{ borderColor: 'var(--wine)' }}>
            {fmt(recipe.breakdown.sugarG)} g
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right" style={{ borderColor: 'var(--wine)' }}>
            {fmt(recipe.podTotal)}
          </TD>
          <TD className="tabular border-t-2 pt-4 text-right" style={{ borderColor: 'var(--wine)' }}>
            {fmt(recipe.pacTotal)}
          </TD>
        </TR>
      </TBody>
    </Table>
  )
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
