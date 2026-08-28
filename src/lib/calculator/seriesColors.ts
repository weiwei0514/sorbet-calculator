/** Maps each recipe component to its categorical CSS color token.
 *  Colors are validated for CVD-safety (adjacent pairs, light+dark) — see globals.css. */
export const COMPONENT_COLOR_VAR: Record<string, string> = {
  fruit: 'var(--series-fruit)',
  otherSugar: 'var(--series-other-sugar)',
  other: 'var(--series-other)',
  stabilizer: 'var(--series-stabilizer)',
  sucrose: 'var(--series-sucrose)',
  water: 'var(--series-water)',
}

export function componentColor(key: string): string {
  return COMPONENT_COLOR_VAR[key] ?? 'var(--faint)'
}
