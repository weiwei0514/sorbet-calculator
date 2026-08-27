import type { ComponentBreakdown, RecipeTotals } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Section } from '@/components/ui/Section'
import { CompositionBar } from './CompositionBar'
import { componentColor } from '@/lib/calculator/seriesColors'

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

// The composition bar's legend above already conveys the role (fruit/other sugar) via
// color + swatch label, so the table row can drop the "水果："/"其他糖類：" prefix and
// stay compact on narrow screens.
function shortLabel(label: string) {
  return label.replace(/^水果：|^其他糖類：/, '')
}

export function ComputedRecipeTable({
  components,
  totals,
}: {
  components: ComponentBreakdown[]
  totals: RecipeTotals
}) {
  return (
    <Section eyebrow="Result" title="自動計算配方">
      <div className="mb-10">
        <CompositionBar components={components} />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>食材</TH>
            <TH className="text-right">重量</TH>
            <TH className="text-right">比例</TH>
          </TR>
        </THead>
        <TBody>
          {components.map((c) => (
            <TR key={c.key}>
              <TD>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: componentColor(c.category) }}
                  />
                  {shortLabel(c.label)}
                </span>
              </TD>
              <TD className="tabular text-right">{fmt(c.weightG)} g</TD>
              <TD className="tabular text-right">{fmt(c.pctOfTotalWeight)}%</TD>
            </TR>
          ))}
          <TR className="border-b-0">
            <TD className="font-display border-t-2 pt-4 text-lg" style={{ borderColor: 'var(--wine)' }}>
              總計
            </TD>
            <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
              {fmt(totals.weightG)} g
            </TD>
            <TD className="tabular border-t-2 pt-4 text-right text-lg" style={{ borderColor: 'var(--wine)' }}>
              100.0%
            </TD>
          </TR>
        </TBody>
      </Table>
    </Section>
  )
}
