'use client'

/** A compact "label | min | max" row used by the Step 0 range editor and the
 *  Step 1 constraint list. Values are plain numbers in the field's own unit. */
export function RangeRow({
  label,
  min,
  max,
  onMin,
  onMax,
  editableLabel = false,
  onLabel,
  disabled = false,
  unit = '%',
  step = 0.5,
}: {
  label: string
  min: number
  max: number
  onMin: (v: number) => void
  onMax: (v: number) => void
  editableLabel?: boolean
  onLabel?: (v: string) => void
  disabled?: boolean
  unit?: string
  step?: number
}) {
  const numberField = (value: number, onChange: (v: number) => void) => (
    <div
      className="flex items-baseline gap-1 border-b pb-1"
      style={{ borderColor: 'var(--rule)', opacity: disabled ? 0.4 : 1 }}
    >
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="tabular w-full bg-transparent text-sm outline-none"
        style={{ color: 'var(--ink)' }}
      />
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {unit}
      </span>
    </div>
  )

  return (
    <div className="grid grid-cols-[1fr_5rem_5rem] items-end gap-3">
      {editableLabel ? (
        <input
          value={label}
          onChange={(e) => onLabel?.(e.target.value)}
          className="border-b bg-transparent pb-1 text-sm outline-none"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
        />
      ) : (
        <span className="pb-1 text-sm" style={{ color: 'var(--ink)' }}>
          {label}
        </span>
      )}
      {numberField(min, onMin)}
      {numberField(max, onMax)}
    </div>
  )
}
