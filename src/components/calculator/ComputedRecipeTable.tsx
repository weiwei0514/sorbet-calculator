import type { ComponentBreakdown, RecipeTotals } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

export function ComputedRecipeTable({
  components,
  totals,
}: {
  components: ComponentBreakdown[]
  totals: RecipeTotals
}) {
  return (
    <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">自動計算配方</h2>
      <Table>
        <THead>
          <TR>
            <TH>食材</TH>
            <TH className="text-right">重量 (g)</TH>
            <TH className="text-right">比例</TH>
          </TR>
        </THead>
        <TBody>
          {components.map((c) => (
            <TR key={c.key}>
              <TD>{c.label}</TD>
              <TD className="text-right">{fmt(c.weightG)}g</TD>
              <TD className="text-right">{fmt(c.pctOfTotalWeight)}%</TD>
            </TR>
          ))}
          <TR className="bg-neutral-50 font-medium dark:bg-neutral-900">
            <TD>總計</TD>
            <TD className="text-right">{fmt(totals.weightG)}g</TD>
            <TD className="text-right">100.0%</TD>
          </TR>
        </TBody>
      </Table>
    </section>
  )
}
