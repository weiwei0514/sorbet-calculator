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
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
      </div>
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}
