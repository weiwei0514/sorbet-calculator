interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  hint?: string
}

export function NumberField({ label, value, onChange, min, max, step = 1, suffix, hint }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <div className="flex items-baseline gap-2 border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="tabular w-full bg-transparent text-lg font-medium outline-none"
          style={{ color: 'var(--ink)' }}
        />
        {suffix && (
          <span className="font-mono-label shrink-0 text-[10px]" style={{ color: 'var(--faint)' }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <span className="text-xs" style={{ color: 'var(--faint)' }}>
          {hint}
        </span>
      )}
    </label>
  )
}
