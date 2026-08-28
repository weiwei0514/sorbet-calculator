import type { Ingredient } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { IngredientCompositionBar } from './IngredientCompositionBar'

interface IngredientTableProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
  expandedIds: Set<string>
  onToggleExpanded: (id: string) => void
}

function ActionLinks({
  ingredient,
  onEdit,
  onDelete,
}: {
  ingredient: Ingredient
  onEdit: (i: Ingredient) => void
  onDelete: (i: Ingredient) => void
}) {
  return (
    <div className="flex shrink-0 gap-6">
      <button
        onClick={() => onEdit(ingredient)}
        className="font-mono-label min-h-11 text-sm hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        修改
      </button>
      <button
        onClick={() => onDelete(ingredient)}
        className="font-mono-label min-h-11 text-sm hover:underline"
        style={{ color: 'var(--danger)' }}
      >
        刪除
      </button>
    </div>
  )
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function fmtNullable(v: number | null) {
  return v == null ? '—' : v.toFixed(2)
}

function StatPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono-label text-[9px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <span className="tabular text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  )
}

export function IngredientTable({ ingredients, onEdit, onDelete, expandedIds, onToggleExpanded }: IngredientTableProps) {
  if (ingredients.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--faint)' }}>
        找不到符合的食材。
      </p>
    )
  }

  return (
    <>
      {/* Mobile: card list — a 7-column table doesn't fit a phone screen without cramped horizontal scroll.
          Each card is a bordered, tappable panel that stays collapsed to name + composition bar; tapping
          reveals the detail stats and only then the edit/delete actions. */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {ingredients.map((ing) => {
          const expanded = expandedIds.has(ing.id)
          return (
            <li
              key={ing.id}
              className="overflow-hidden rounded-lg border"
              style={{
                borderColor: expanded ? 'var(--accent)' : 'var(--rule)',
                background: expanded ? 'color-mix(in oklab, var(--accent) 8%, transparent)' : 'transparent',
              }}
            >
              <button
                onClick={() => onToggleExpanded(ing.id)}
                aria-expanded={expanded}
                className="flex w-full flex-col gap-3 p-4 text-left active:opacity-70"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg">{ing.name}</span>
                  <span style={{ color: 'var(--faint)' }}>
                    <Chevron expanded={expanded} />
                  </span>
                </div>
                <IngredientCompositionBar ingredient={ing} />
              </button>

              {expanded && (
                <div className="flex flex-col gap-4 px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <StatPair label="水分%" value={ing.waterPct.toFixed(1)} />
                    <StatPair label="糖分%" value={ing.sugarPct.toFixed(1)} />
                    <StatPair label="油脂%" value={ing.fatPct.toFixed(1)} />
                    <StatPair label="無脂固形物%" value={ing.nonFatSolidsPct.toFixed(1)} />
                    <StatPair label="其他固形物%" value={ing.otherSolidsPct.toFixed(1)} />
                    <StatPair label="總固形物%" value={ing.totalSolidsPct.toFixed(1)} />
                    <StatPair label="POD" value={fmtNullable(ing.podCoefficient)} />
                    <StatPair label="PAC" value={fmtNullable(ing.pacCoefficient)} />
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                    <ActionLinks ingredient={ing} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* sm+: full table */}
      <div className="hidden sm:block">
        <Table>
          <THead>
            <TR>
              <TH>名稱</TH>
              <TH>組成</TH>
              <TH className="text-right">水分%</TH>
              <TH className="text-right">糖分%</TH>
              <TH className="text-right">油脂%</TH>
              <TH className="text-right">無脂固形物%</TH>
              <TH className="text-right">其他固形物%</TH>
              <TH className="text-right">總固形物%</TH>
              <TH className="text-right">POD</TH>
              <TH className="text-right">PAC</TH>
              <TH className="text-right">操作</TH>
            </TR>
          </THead>
          <TBody>
            {ingredients.map((ing) => (
              <TR key={ing.id}>
                <TD className="font-display text-base">{ing.name}</TD>
                <TD>
                  <IngredientCompositionBar ingredient={ing} />
                </TD>
                <TD className="tabular text-right">{ing.waterPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.sugarPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.fatPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.nonFatSolidsPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.otherSolidsPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.totalSolidsPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{fmtNullable(ing.podCoefficient)}</TD>
                <TD className="tabular text-right">{fmtNullable(ing.pacCoefficient)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end">
                    <ActionLinks ingredient={ing} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
