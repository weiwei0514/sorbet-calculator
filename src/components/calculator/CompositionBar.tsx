import type { ComponentBreakdown } from '@/lib/calculator/types'
import { componentColor } from '@/lib/calculator/seriesColors'

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

/** Minimum segment width (in % of the bar) for an inline direct label to fit
 *  with comfortable padding. Below this, the legend + table carry the value instead. */
const MIN_LABEL_PCT = 12

export function CompositionBar({ components }: { components: ComponentBreakdown[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-6 gap-0.5 overflow-hidden rounded-[4px]">
        {components
          .filter((c) => c.weightG > 0)
          .map((c) => (
            <div
              key={c.key}
              title={`${c.label} · ${fmt(c.weightG)}g · ${fmt(c.pctOfTotalWeight)}%`}
              className="flex h-full items-center justify-center overflow-hidden first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ width: `${c.pctOfTotalWeight}%`, background: componentColor(c.category) }}
            >
              {c.pctOfTotalWeight >= MIN_LABEL_PCT && (
                <span className="font-mono-label truncate px-1.5 text-[9px] text-white">
                  {fmt(c.pctOfTotalWeight)}%
                </span>
              )}
            </div>
          ))}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {components.map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: componentColor(c.category) }}
            />
            <span>{c.label.replace(/^水果：|^其他糖類：/, '')}</span>
            <span className="tabular" style={{ color: 'var(--faint)' }}>
              {fmt(c.weightG)}g · {fmt(c.pctOfTotalWeight)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
