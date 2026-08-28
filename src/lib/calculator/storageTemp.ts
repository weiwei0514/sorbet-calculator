/**
 * 建議儲存溫度 — 依 reference/temp.jpg「冰淇淋抗凍力在各溫度下的數值」。
 *
 *   抗凍力 (PAC，每 1000g)   儲存溫度
 *   241–260                  -10°C
 *   261–280                  -11°C
 *   281–300                  -12°C
 *   301–320                  -13°C
 *   321–340                  -14°C
 *   341–360                  -15°C
 *
 * 規則：以 241–260 → -10°C 為基準，PAC 每增加 20，儲存溫度降低 1°C。
 * 用「每 1000g PAC」而非總 PAC，因為它才是與批量無關的強度值。
 */

export interface StorageTempEstimate {
  /** The 每 1000g PAC value this was derived from. */
  pacPer1000g: number
  /** Recommended storage / holding temperature in whole °C (negative). */
  tempC: number
  /** The tabulated PAC band, e.g. "301–320". */
  band: string
  /** False when pacPer1000g falls outside the table's 241–360 range —
   *  tempC is then extrapolated from the +20 PAC / −1°C rule. */
  withinTable: boolean
}

const BASE_PAC = 241
const BASE_TEMP_C = -10
const PAC_PER_DEGREE = 20

export function estimateStorageTemp(pacPer1000g: number): StorageTempEstimate {
  const step = Math.floor((pacPer1000g - BASE_PAC) / PAC_PER_DEGREE)
  const bandLow = BASE_PAC + step * PAC_PER_DEGREE
  return {
    pacPer1000g,
    tempC: BASE_TEMP_C - step,
    band: `${bandLow}–${bandLow + PAC_PER_DEGREE - 1}`,
    withinTable: pacPer1000g >= 241 && pacPer1000g <= 360,
  }
}

/** "-13°C" — with a note appended when the value is extrapolated beyond the table. */
export function formatStorageTemp(estimate: StorageTempEstimate): string {
  const base = `${estimate.tempC}°C`
  return estimate.withinTable ? base : `${base}（超出參考表 241–360，依每 +20 PAC 降 1°C 推算）`
}
