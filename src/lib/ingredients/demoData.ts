import type { Ingredient } from '@/lib/calculator/types'

/** Mirrors the seed data in supabase/schema.sql, used when Supabase isn't configured yet
 *  so the calculator is still usable (read-only demo, no persistence) right after cloning. */
export const DEMO_INGREDIENTS: Ingredient[] = [
  { id: 'demo-strawberry', name: '草莓', category: 'fruit', waterPct: 87, sugarPct: 9, otherSolidsPct: 4, totalSolidsPct: 13 },
  { id: 'demo-peach', name: '桃子', category: 'fruit', waterPct: 88, sugarPct: 9, otherSolidsPct: 3, totalSolidsPct: 12 },
  { id: 'demo-mango', name: '芒果', category: 'fruit', waterPct: 82, sugarPct: 15, otherSolidsPct: 3, totalSolidsPct: 18 },
  { id: 'demo-banana', name: '香蕉', category: 'fruit', waterPct: 74, sugarPct: 21, otherSolidsPct: 5, totalSolidsPct: 26 },
  { id: 'demo-pineapple', name: '鳳梨', category: 'fruit', waterPct: 85, sugarPct: 12, otherSolidsPct: 3, totalSolidsPct: 15 },
  { id: 'demo-passionfruit', name: '百香果', category: 'fruit', waterPct: 82, sugarPct: 11, otherSolidsPct: 7, totalSolidsPct: 18 },
  { id: 'demo-raspberry', name: '覆盆子', category: 'fruit', waterPct: 85, sugarPct: 8, otherSolidsPct: 7, totalSolidsPct: 15 },
  { id: 'demo-blueberry', name: '藍莓', category: 'fruit', waterPct: 84, sugarPct: 12, otherSolidsPct: 4, totalSolidsPct: 16 },
  { id: 'demo-pomelo', name: '柚子', category: 'fruit', waterPct: 89, sugarPct: 8, otherSolidsPct: 3, totalSolidsPct: 11 },
  { id: 'demo-lemon', name: '檸檬', category: 'fruit', waterPct: 90, sugarPct: 5, otherSolidsPct: 5, totalSolidsPct: 10 },
  { id: 'demo-orange', name: '柳橙', category: 'fruit', waterPct: 87, sugarPct: 10, otherSolidsPct: 3, totalSolidsPct: 13 },
  { id: 'demo-glucose-powder', name: '葡萄糖粉', category: 'other_sugar', waterPct: 19, sugarPct: 81, otherSolidsPct: 0, totalSolidsPct: 81 },
]
