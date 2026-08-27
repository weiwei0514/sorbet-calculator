import type { Ingredient } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { IngredientCompositionBar } from './IngredientCompositionBar'

interface IngredientTableProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
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
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => onEdit(ing)}
                  className="font-mono-label text-[10px] hover:underline"
                  style={{ color: 'var(--gold)' }}
                >
                  修改
                </button>
                <button
                  onClick={() => onDelete(ing)}
                  className="font-mono-label text-[10px] hover:underline"
                  style={{ color: 'var(--wine)' }}
                >
                  刪除
                </button>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  )
}
