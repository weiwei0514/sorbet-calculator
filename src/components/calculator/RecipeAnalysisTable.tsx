import type { RecipeResult } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

function fmtDelta(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${fmt(n)}%`
}

const COMPARISON_ROWS: { key: keyof RecipeResult['comparison']; label: string }[] = [
  { key: 'totalSolidsPct', label: '總固形物' },
  { key: 'fruitPct', label: '水果比例' },
  { key: 'otherSugarPct', label: '其他糖類比例' },
  { key: 'stabilizerPct', label: '膠體比例' },
]

export function RecipeAnalysisTable({ result }: { result: RecipeResult }) {
  const { totals, comparison } = result

  return (
    <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">配方分析</h2>

      <Table>
        <THead>
          <TR>
            <TH>項目</TH>
            <TH className="text-right">重量 (g)</TH>
            <TH className="text-right">比例</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>水分</TD>
            <TD className="text-right">{fmt(totals.waterG)}g</TD>
            <TD className="text-right">{fmt(totals.waterPct)}%</TD>
          </TR>
          <TR>
            <TD>糖分</TD>
            <TD className="text-right">{fmt(totals.sugarG)}g</TD>
            <TD className="text-right">{fmt(totals.sugarPct)}%</TD>
          </TR>
          <TR>
            <TD>其他固形物</TD>
            <TD className="text-right">{fmt(totals.otherSolidsG)}g</TD>
            <TD className="text-right">{fmt(totals.otherSolidsPct)}%</TD>
          </TR>
          <TR className="bg-neutral-50 font-medium dark:bg-neutral-900">
            <TD>總固形物</TD>
            <TD className="text-right">{fmt(totals.totalSolidsG)}g</TD>
            <TD className="text-right">{fmt(totals.totalSolidsPct)}%</TD>
          </TR>
        </TBody>
      </Table>

      <h3 className="mt-5 mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        目標 vs 實際（含四捨五入誤差）
      </h3>
      <Table>
        <THead>
          <TR>
            <TH>項目</TH>
            <TH className="text-right">目標</TH>
            <TH className="text-right">實際</TH>
            <TH className="text-right">誤差</TH>
          </TR>
        </THead>
        <TBody>
          {COMPARISON_ROWS.map(({ key, label }) => {
            const c = comparison[key]
            const isOff = Math.abs(c.deltaPct) > 0.1
            return (
              <TR key={key}>
                <TD>{label}</TD>
                <TD className="text-right">{fmt(c.target)}%</TD>
                <TD className="text-right">{fmt(c.actual)}%</TD>
                <TD className={`text-right ${isOff ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  {fmtDelta(c.deltaPct)}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
    </section>
  )
}
