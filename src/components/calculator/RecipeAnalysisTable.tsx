import type { RecipeResult } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Section } from '@/components/ui/Section'
import { RangeBar } from './RangeBar'

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

export function RecipeAnalysisTable({ result }: { result: RecipeResult }) {
  const { totals, comparison, inputs } = result

  return (
    <Section eyebrow="Analysis" title="配方分析">
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
            <TD className="tabular text-right">{fmt(totals.waterG)} g</TD>
            <TD className="tabular text-right">{fmt(totals.waterPct)}%</TD>
          </TR>
          <TR>
            <TD>糖分</TD>
            <TD className="tabular text-right">{fmt(totals.sugarG)} g</TD>
            <TD className="tabular text-right">{fmt(totals.sugarPct)}%</TD>
          </TR>
          <TR>
            <TD>其他固形物</TD>
            <TD className="tabular text-right">{fmt(totals.otherSolidsG)} g</TD>
            <TD className="tabular text-right">{fmt(totals.otherSolidsPct)}%</TD>
          </TR>
          <TR className="border-b-0">
            <TD className="font-display border-t-2 pt-4 text-lg" style={{ borderColor: 'var(--wine)' }}>
              總固形物
            </TD>
            <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
              {fmt(totals.totalSolidsG)} g
            </TD>
            <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
              {fmt(totals.totalSolidsPct)}%
            </TD>
          </TR>
        </TBody>
      </Table>

      <p className="font-mono-label mt-10 mb-5 text-[10px]" style={{ color: 'var(--faint)' }}>
        Target vs Actual · 目標 vs 實際（含四捨五入誤差）
      </p>
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        <RangeBar
          label="總固形物"
          actual={comparison.totalSolidsPct.actual}
          target={comparison.totalSolidsPct.target}
          range={[26, 34]}
        />
        <RangeBar
          label="水果比例"
          actual={comparison.fruitPct.actual}
          target={comparison.fruitPct.target}
          range={[10, 70]}
        />
        <RangeBar
          label="其他糖類比例"
          actual={comparison.otherSugarPct.actual}
          target={comparison.otherSugarPct.target}
          axisMax={Math.max(comparison.otherSugarPct.target * 1.6, 1)}
        />
        <RangeBar
          label="膠體比例"
          actual={comparison.stabilizerPct.actual}
          target={comparison.stabilizerPct.target}
          axisMax={Math.max(inputs.stabilizerPct * 1.6, 1)}
        />
      </div>
    </Section>
  )
}
