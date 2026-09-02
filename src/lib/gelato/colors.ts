/** Categorical colours for the Gelato composition bar. A gelato recipe can list
 *  any number of arbitrary ingredients, so colours are assigned by position from
 *  this ordered, CVD-checked palette (the same tokens the Sorbet series use). */
const PALETTE = [
  'var(--series-water)',
  'var(--series-fat)',
  'var(--series-non-fat-solids)',
  'var(--series-sucrose)',
  'var(--series-other-sugar)',
  'var(--series-stabilizer)',
  'var(--series-fruit)',
  'var(--series-other)',
]

export function gelatoColor(index: number): string {
  return PALETTE[index % PALETTE.length]
}
