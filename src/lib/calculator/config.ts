import type { SyntheticComponentConfig } from './types'

/** 砂糖 — 引擎內建的固定組成，不存在食材資料庫裡。
 *  放在這裡而非寫死在 engine.ts，未來要換成可設定的糖類只需替換這個 config。 */
export const DEFAULT_SUCROSE_CONFIG: SyntheticComponentConfig = {
  key: 'sucrose',
  label: '砂糖',
  waterPct: 0,
  sugarPct: 100,
  otherSolidsPct: 0,
  // 蔗糖是 POD／PAC 的基準值 = 1.00（規格明訂的固定軸心，非使用者可調係數）。
  podCoefficient: 1.0,
  pacCoefficient: 1.0,
}

/** 膠體 — 依規格，100% 視為「其他固形物」。 */
export const DEFAULT_STABILIZER_CONFIG: SyntheticComponentConfig = {
  key: 'stabilizer',
  label: '膠體',
  waterPct: 0,
  sugarPct: 0,
  otherSolidsPct: 100,
  // sugarPct=0 讓貢獻恆為 0，這兩個係數只是補齊型別。
  podCoefficient: 0,
  pacCoefficient: 0,
}

export interface EngineConfig {
  sucrose: SyntheticComponentConfig
  stabilizer: SyntheticComponentConfig
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  sucrose: DEFAULT_SUCROSE_CONFIG,
  stabilizer: DEFAULT_STABILIZER_CONFIG,
}
