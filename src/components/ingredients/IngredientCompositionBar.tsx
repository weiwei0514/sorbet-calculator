import type { Ingredient } from '@/lib/calculator/types'

/** Reuses the water/sucrose/stabilizer series tokens where the meaning overlaps with the
 *  recipe composition bar, plus two new ones (fat/non-fat-solids) validated alongside them
 *  as one 5-color CVD-safe set (adjacent pairs) — see globals.css. */
const SEGMENTS: { key: keyof Ingredient; colorVar: string }[] = [
  { key: 'waterPct', colorVar: 'var(--series-water)' },
  { key: 'sugarPct', colorVar: 'var(--series-sucrose)' },
  { key: 'fatPct', colorVar: 'var(--series-fat)' },
  { key: 'nonFatSolidsPct', colorVar: 'var(--series-non-fat-solids)' },
  { key: 'otherSolidsPct', colorVar: 'var(--series-stabilizer)' },
]

export function IngredientCompositionBar({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div
      className="flex h-1.5 w-24 gap-0.5 overflow-hidden rounded-full"
      title={`水分 ${ingredient.waterPct}% · 糖分 ${ingredient.sugarPct}% · 油脂 ${ingredient.fatPct}% · 無脂固形物 ${ingredient.nonFatSolidsPct}% · 其他固形物 ${ingredient.otherSolidsPct}%`}
    >
      {SEGMENTS.map(({ key, colorVar }) => {
        const pct = Number(ingredient[key])
        if (pct <= 0) return null
        return <div key={key} style={{ width: `${pct}%`, background: colorVar }} />
      })}
    </div>
  )
}
