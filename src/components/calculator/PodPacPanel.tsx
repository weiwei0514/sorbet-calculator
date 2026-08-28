import type { Ingredient, RecipeInputs, RecipeResult } from '@/lib/calculator/types'
import { suggestSugarAdjustments } from '@/lib/calculator/podPacSuggestion'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Section } from '@/components/ui/Section'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function fmtSigned(n: number, digits = 1) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${fmt(n, digits)}`
}

function StatTile({ label, value, unit = '' }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
        {value}
        {unit && (
          <span className="text-sm" style={{ color: 'var(--faint)' }}>
            {' '}
            {unit}
          </span>
        )}
      </span>
    </div>
  )
}

function TargetInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <input
        type="number"
        step={0.1}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
        placeholder="未設定"
        className="tabular w-full border-b bg-transparent pb-1.5 text-lg font-medium outline-none"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
      />
    </label>
  )
}

interface PodPacPanelProps {
  result: RecipeResult
  sugarCandidates: Ingredient[]
  onTargetChange: (patch: Partial<RecipeInputs>) => void
}

export function PodPacPanel({ result, sugarCandidates, onTargetChange }: PodPacPanelProps) {
  const { totals, podTarget, pacTarget, missingCoefficientIngredientNames, inputs } = result

  const sugarComponents = result.components.filter(
    (c) => c.category === 'fruit' || c.category === 'otherSugar' || c.category === 'sucrose'
  )

  const suggestions = suggestSugarAdjustments(result, sugarCandidates)
  const storage = estimateStorageTemp(totals.pacPer1000g)

  return (
    <Section eyebrow="Sweetness & Freezing Point" title="甜度與抗凍力（POD／PAC）">
      <div className="mb-10 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        <TargetInput label="目標 POD（選填）" value={inputs.targetPOD} onChange={(v) => onTargetChange({ targetPOD: v })} />
        <TargetInput label="目標 PAC（選填）" value={inputs.targetPAC} onChange={(v) => onTargetChange({ targetPAC: v })} />
      </div>

      {missingCoefficientIngredientNames.length > 0 && (
        <p className="mb-8 border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--muted)' }}>
          {missingCoefficientIngredientNames.join('、')} 尚未設定 POD/PAC 係數，以下加總可能不完整。請至食材資料庫補上。
        </p>
      )}

      <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="總糖量" value={fmt(totals.sugarG)} unit="g" />
        <StatTile label="總糖比例" value={fmt(totals.sugarPct)} unit="%" />
        <StatTile label="總 POD" value={fmt(totals.totalPOD)} />
        <StatTile label="總 PAC" value={fmt(totals.totalPAC)} />
        <StatTile label="每 1000g POD" value={fmt(totals.podPer1000g)} />
        <StatTile label="每 1000g PAC" value={fmt(totals.pacPer1000g)} />
      </div>
      <p className="mb-6 text-xs" style={{ color: 'var(--faint)' }}>
        總 POD／總 PAC 會隨配方總重量等比例變化；「每 1000g」是配方比例不變時保持不變的強度標準值，調整總重量放大縮小配方時可以用這兩個數字確認強度沒有跑掉。
      </p>

      <div
        className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 pl-6"
        style={{ borderColor: 'var(--accent)' }}
      >
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          建議儲存溫度
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {formatStorageTemp(storage)}
        </span>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>
          依每 1000g PAC {fmt(totals.pacPer1000g)}（參考表 {storage.band}）
        </span>
      </div>
      <p className="mb-10 text-xs" style={{ color: 'var(--faint)' }}>
        參考「冰淇淋抗凍力在各溫度下的數值」：PAC 241–260 對應 -10°C，之後每 +20 PAC 降 1°C。
        {missingCoefficientIngredientNames.length > 0 && ' 目前有原料缺少 PAC 係數，此溫度可能偏高，僅供參考。'}
      </p>

      {(podTarget || pacTarget) && (
        <div className="mb-10 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
          {podTarget && (
            <div className="flex items-baseline justify-between border-b pb-2" style={{ borderColor: 'var(--rule)' }}>
              <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                POD 差距
              </span>
              <span className="tabular text-sm" style={{ color: 'var(--muted)' }}>
                目前 {fmt(podTarget.actual)} ／ 目標 {fmt(podTarget.target)} ／{' '}
                <span style={{ color: Math.abs(podTarget.gap) > 0.05 ? 'var(--accent)' : 'var(--muted)' }}>
                  差距 {fmtSigned(podTarget.gap)}
                </span>
              </span>
            </div>
          )}
          {pacTarget && (
            <div className="flex items-baseline justify-between border-b pb-2" style={{ borderColor: 'var(--rule)' }}>
              <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                PAC 差距
              </span>
              <span className="tabular text-sm" style={{ color: 'var(--muted)' }}>
                目前 {fmt(pacTarget.actual)} ／ 目標 {fmt(pacTarget.target)} ／{' '}
                <span style={{ color: Math.abs(pacTarget.gap) > 0.05 ? 'var(--accent)' : 'var(--muted)' }}>
                  差距 {fmtSigned(pacTarget.gap)}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <p className="font-mono-label mb-5 text-[10px]" style={{ color: 'var(--faint)' }}>
        Contribution Breakdown · 逐項貢獻與計算過程
      </p>
      <Table>
        <THead>
          <TR>
            <TH>原料</TH>
            <TH className="text-right">重量</TH>
            <TH className="text-right">糖量</TH>
            <TH className="text-right">POD貢獻</TH>
            <TH className="text-right">PAC貢獻</TH>
          </TR>
        </THead>
        <TBody>
          {sugarComponents.map((c) => {
            const sugarFraction = c.weightG > 0 ? c.sugarG / c.weightG : 0
            return (
              <TR key={c.key}>
                <TD>{c.label}</TD>
                <TD className="tabular text-right">{fmt(c.weightG)} g</TD>
                <TD className="tabular text-right">{fmt(c.sugarG)} g</TD>
                <TD className="text-right">
                  {c.podCoefficient == null ? (
                    <span style={{ color: 'var(--faint)' }}>尚未設定</span>
                  ) : (
                    <div>
                      <div className="tabular">{fmt(c.podContributionG)}</div>
                      <div className="text-xs" style={{ color: 'var(--faint)' }}>
                        {fmt(c.weightG, 0)} × {fmt(sugarFraction, 2)} × {fmt(c.podCoefficient, 2)}
                      </div>
                    </div>
                  )}
                </TD>
                <TD className="text-right">
                  {c.pacCoefficient == null ? (
                    <span style={{ color: 'var(--faint)' }}>尚未設定</span>
                  ) : (
                    <div>
                      <div className="tabular">{fmt(c.pacContributionG)}</div>
                      <div className="text-xs" style={{ color: 'var(--faint)' }}>
                        {fmt(c.weightG, 0)} × {fmt(sugarFraction, 2)} × {fmt(c.pacCoefficient, 2)}
                      </div>
                    </div>
                  )}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>

      {(podTarget || pacTarget) && (
        <>
          <p className="font-mono-label mt-10 mb-2 text-[10px]" style={{ color: 'var(--faint)' }}>
            Sugar Adjustment Estimate · 糖類調整建議（估算）
          </p>
          <p className="mb-5 text-xs" style={{ color: 'var(--faint)' }}>
            以下是「保持水果比例、膠體比例、目標總固形物、總重不變，只調整這一種其他糖類用量」時的估算——POD
            與 PAC 各自需要的克數若差很多，代表單一種糖無法同時命中兩個目標，可能需要混合兩種糖。
          </p>
          <Table>
            <THead>
              <TR>
                <TH>糖類</TH>
                <TH className="text-right">POD 需求克數</TH>
                <TH className="text-right">PAC 需求克數</TH>
                <TH className="text-right">兩者差距</TH>
              </TR>
            </THead>
            <TBody>
              {suggestions.map((s) => (
                <TR key={s.ingredientId}>
                  <TD>{s.ingredientName}</TD>
                  {!s.hasCoefficients ? (
                    <TD colSpan={3} style={{ color: 'var(--faint)' }}>
                      尚未設定 POD/PAC 係數
                    </TD>
                  ) : (
                    <>
                      <TD className="tabular text-right">
                        {s.suggestedGramsForPOD == null ? '—' : `${fmtSigned(s.suggestedGramsForPOD)} g`}
                      </TD>
                      <TD className="tabular text-right">
                        {s.suggestedGramsForPAC == null ? '—' : `${fmtSigned(s.suggestedGramsForPAC)} g`}
                      </TD>
                      <TD className="tabular text-right">{s.agreementGapG == null ? '—' : `${fmt(s.agreementGapG)} g`}</TD>
                    </>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </Section>
  )
}
