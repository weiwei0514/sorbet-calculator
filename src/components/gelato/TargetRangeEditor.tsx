'use client'

import type { GelatoTargetRanges, MetricRange } from '@/lib/gelato/types'
import { RangeRow } from './RangeRow'

type NumericKey = 'sugar' | 'fat' | 'msnf' | 'otherSolids' | 'totalSolids' | 'perceivedSugar'

const ROWS: { key: NumericKey; label: string }[] = [
  { key: 'sugar', label: 'Sugar 糖' },
  { key: 'fat', label: 'Fat 脂肪' },
  { key: 'msnf', label: 'MSNF 無脂乳固形物' },
  { key: 'otherSolids', label: 'Other Solids 其他固形物' },
  { key: 'totalSolids', label: 'Total Solids 總固形物' },
  { key: 'perceivedSugar', label: '有感糖（蔗糖當量）' },
]

export function TargetRangeEditor({
  ranges,
  onChange,
}: {
  ranges: GelatoTargetRanges
  onChange: (next: GelatoTargetRanges) => void
}) {
  const setRange = (key: NumericKey, patch: Partial<MetricRange>) =>
    onChange({ ...ranges, [key]: { ...ranges[key], ...patch } })

  const pacEnabled = ranges.pac != null

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_5rem_5rem] gap-3">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          指標
        </span>
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          最低
        </span>
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          最高
        </span>
      </div>

      {ROWS.map((row) => (
        <RangeRow
          key={row.key}
          label={row.label}
          min={ranges[row.key].min}
          max={ranges[row.key].max}
          onMin={(v) => setRange(row.key, { min: v })}
          onMax={(v) => setRange(row.key, { max: v })}
        />
      ))}

      {/* Custom, user-nameable metric — label + band persisted, not computed in v1. */}
      <div className="flex flex-col gap-2">
        <RangeRow
          label={ranges.custom.label}
          editableLabel
          onLabel={(v) => onChange({ ...ranges, custom: { ...ranges.custom, label: v } })}
          min={ranges.custom.min}
          max={ranges.custom.max}
          onMin={(v) => onChange({ ...ranges, custom: { ...ranges.custom, min: v } })}
          onMax={(v) => onChange({ ...ranges, custom: { ...ranges.custom, max: v } })}
        />
        <span className="text-[10px]" style={{ color: 'var(--faint)' }}>
          自訂指標：名稱與範圍會保留，但目前版本不計算數值、不做檢查（保留給未來擴充）
        </span>
      </div>

      {/* PAC — optional constraint. */}
      <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            checked={pacEnabled}
            onChange={(e) => onChange({ ...ranges, pac: e.target.checked ? { min: 0, max: 300 } : null })}
          />
          限制 PAC 範圍
        </label>
        {pacEnabled && ranges.pac && (
          <RangeRow
            label="PAC"
            unit=""
            step={1}
            min={ranges.pac.min}
            max={ranges.pac.max}
            onMin={(v) => onChange({ ...ranges, pac: { ...ranges.pac!, min: v } })}
            onMax={(v) => onChange({ ...ranges, pac: { ...ranges.pac!, max: v } })}
          />
        )}
      </div>
    </div>
  )
}
