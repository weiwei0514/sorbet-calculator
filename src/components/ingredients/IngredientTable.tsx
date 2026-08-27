import type { Ingredient } from '@/lib/calculator/types'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'

const CATEGORY_LABELS: Record<string, string> = {
  fruit: '水果',
  other_sugar: '其他糖類',
}

interface IngredientTableProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

export function IngredientTable({ ingredients, onEdit, onDelete }: IngredientTableProps) {
  if (ingredients.length === 0) {
    return <p className="text-sm text-neutral-500">找不到符合的食材。</p>
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>名稱</TH>
          <TH>分類</TH>
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
            <TD>{ing.name}</TD>
            <TD>{CATEGORY_LABELS[ing.category] ?? ing.category}</TD>
            <TD className="text-right">{ing.waterPct.toFixed(1)}</TD>
            <TD className="text-right">{ing.sugarPct.toFixed(1)}</TD>
            <TD className="text-right">{ing.otherSolidsPct.toFixed(1)}</TD>
            <TD className="text-right">{ing.totalSolidsPct.toFixed(1)}</TD>
            <TD className="text-right">
              <div className="flex justify-end gap-2">
                <button onClick={() => onEdit(ing)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  修改
                </button>
                <button onClick={() => onDelete(ing)} className="text-sm text-red-600 hover:underline dark:text-red-400">
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
