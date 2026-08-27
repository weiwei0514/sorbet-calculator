import type { Ingredient } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { IngredientCompositionBar } from './IngredientCompositionBar'

interface IngredientTableProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
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
    <div className="flex gap-5">
      <button
        onClick={() => onEdit(ingredient)}
        className="font-mono-label min-h-11 text-[10px] hover:underline"
        style={{ color: 'var(--gold)' }}
      >
        修改
      </button>
      <button
        onClick={() => onDelete(ingredient)}
        className="font-mono-label min-h-11 text-[10px] hover:underline"
        style={{ color: 'var(--wine)' }}
      >
        刪除
      </button>
    </div>
  )
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

export function IngredientTable({ ingredients, onEdit, onDelete }: IngredientTableProps) {
  if (ingredients.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--faint)' }}>
        找不到符合的食材。
      </p>
    )
  }

  return (
    <>
      {/* Mobile: card list — a 7-column table doesn't fit a phone screen without cramped horizontal scroll. */}
      <ul className="flex flex-col gap-5 sm:hidden">
        {ingredients.map((ing) => (
          <li key={ing.id} className="flex flex-col gap-4 border-b pb-5" style={{ borderColor: 'var(--rule)' }}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-lg">{ing.name}</span>
              <ActionLinks ingredient={ing} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <IngredientCompositionBar ingredient={ing} />
            <div className="grid grid-cols-4 gap-3">
              <StatPair label="水分%" value={ing.waterPct.toFixed(1)} />
              <StatPair label="糖分%" value={ing.sugarPct.toFixed(1)} />
              <StatPair label="其他固形物%" value={ing.otherSolidsPct.toFixed(1)} />
              <StatPair label="總固形物%" value={ing.totalSolidsPct.toFixed(1)} />
            </div>
          </li>
        ))}
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
              <TH className="text-right">其他固形物%</TH>
              <TH className="text-right">總固形物%</TH>
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
                <TD className="tabular text-right">{ing.otherSolidsPct.toFixed(1)}</TD>
                <TD className="tabular text-right">{ing.totalSolidsPct.toFixed(1)}</TD>
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
