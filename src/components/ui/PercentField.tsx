import { NumberField } from './NumberField'

interface PercentFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function PercentField({ label, value, onChange, min, max, step = 0.5 }: PercentFieldProps) {
  const hint = min !== undefined && max !== undefined ? `範圍 ${min}%~${max}%` : undefined
  return (
    <NumberField
      label={label}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      suffix="%"
      hint={hint}
    />
  )
}
