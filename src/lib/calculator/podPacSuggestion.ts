import type { Ingredient, RecipeResult } from './types'
import { DEFAULT_SUCROSE_CONFIG } from './config'

export interface SugarAdjustmentSuggestion {
  ingredientId: string
  ingredientName: string
  hasCoefficients: boolean
  /** ΔPOD / ΔPAC per +1g of this ingredient used as the "其他糖類", holding all other
   *  inputs fixed (sucrose auto-rebalances to keep 目標總固形物 unchanged — see engine.ts). */
  sensitivityPOD: number | null
  sensitivityPAC: number | null
  /** Grams to add (positive) or remove (negative) of this ingredient to close the POD/PAC
   *  gap on its own — two independent single-metric estimates, not a combined solve. */
  suggestedGramsForPOD: number | null
  suggestedGramsForPAC: number | null
  /** |suggestedGramsForPOD - suggestedGramsForPAC| — smaller means this one sugar can
   *  reasonably satisfy both targets at once; larger means POD and PAC pull in different
   *  directions and a single-sugar swap likely can't hit both. */
  agreementGapG: number | null
}

interface SuggestSugarAdjustmentsConfig {
  sucrosePodCoefficient: number
  sucrosePacCoefficient: number
}

const DEFAULT_CONFIG: SuggestSugarAdjustmentsConfig = {
  sucrosePodCoefficient: DEFAULT_SUCROSE_CONFIG.podCoefficient,
  sucrosePacCoefficient: DEFAULT_SUCROSE_CONFIG.pacCoefficient,
}

/**
 * Estimates, per candidate "other sugar" ingredient, how many grams to add/remove
 * (holding fruit%/stabilizer%/target solids%/total weight fixed) to close the current
 * POD and/or PAC gap. This is a single-variable sensitivity estimate, not a solver that
 * hits both targets simultaneously — see the sign/derivation note in the project plan.
 * Returns [] if neither podTarget nor pacTarget is set on the result.
 */
export function suggestSugarAdjustments(
  result: RecipeResult,
  otherSugarCandidates: Ingredient[],
  config: SuggestSugarAdjustmentsConfig = DEFAULT_CONFIG
): SugarAdjustmentSuggestion[] {
  const { podTarget, pacTarget } = result
  if (!podTarget && !pacTarget) return []

  const suggestions = otherSugarCandidates.map((ingredient): SugarAdjustmentSuggestion => {
    const hasCoefficients = ingredient.podCoefficient != null && ingredient.pacCoefficient != null
    if (!hasCoefficients) {
      return {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        hasCoefficients: false,
        sensitivityPOD: null,
        sensitivityPAC: null,
        suggestedGramsForPOD: null,
        suggestedGramsForPAC: null,
        agreementGapG: null,
      }
    }

    const sugarFrac = ingredient.sugarPct / 100
    const solidsFrac = ingredient.totalSolidsPct / 100

    const sensitivityPOD = sugarFrac * ingredient.podCoefficient! - solidsFrac * config.sucrosePodCoefficient
    const sensitivityPAC = sugarFrac * ingredient.pacCoefficient! - solidsFrac * config.sucrosePacCoefficient

    const suggestedGramsForPOD =
      podTarget && Math.abs(sensitivityPOD) > 1e-9 ? podTarget.gap / sensitivityPOD : null
    const suggestedGramsForPAC =
      pacTarget && Math.abs(sensitivityPAC) > 1e-9 ? pacTarget.gap / sensitivityPAC : null

    const agreementGapG =
      suggestedGramsForPOD != null && suggestedGramsForPAC != null
        ? Math.abs(suggestedGramsForPOD - suggestedGramsForPAC)
        : null

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      hasCoefficients: true,
      sensitivityPOD,
      sensitivityPAC,
      suggestedGramsForPOD,
      suggestedGramsForPAC,
      agreementGapG,
    }
  })

  return suggestions.sort((a, b) => {
    if (a.agreementGapG == null) return 1
    if (b.agreementGapG == null) return -1
    return a.agreementGapG - b.agreementGapG
  })
}
