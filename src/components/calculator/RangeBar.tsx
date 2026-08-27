function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

interface RangeBarProps {
  label: string
  actual: number
  target: number
  /** Allowed band for this input, e.g. [25, 60] for fruit%. Omitted when the field is free-input (e.g. 膠體). */
  range?: [number, number]
  /** Axis span the track represents; defaults to the range padded by 20%, or 0–actual*1.5 without a range. */
  axisMax?: number
}

export function RangeBar({ label, actual, target, range, axisMax }: RangeBarProps) {
  const max = axisMax ?? (range ? range[1] * 1.15 : Math.max(actual, target) * 1.4 || 1)
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100))
  const isOff = Math.abs(actual - target) > 0.1

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          {label}
        </span>
        <span className="tabular text-sm" style={{ color: isOff ? 'var(--gold)' : 'var(--muted)' }}>
          {fmt(actual)}% <span style={{ color: 'var(--faint)' }}>／目標 {fmt(target)}%</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'var(--rule)' }}>
        {range && (
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              left: `${pct(range[0])}%`,
              width: `${pct(range[1]) - pct(range[0])}%`,
              background: 'color-mix(in oklab, var(--wine) 18%, transparent)',
            }}
          />
        )}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
          style={{
            left: `calc(${pct(actual)}% - 6px)`,
            background: 'var(--wine)',
            // surface ring so the marker stays legible against the tinted band
            boxShadow: '0 0 0 2px var(--surface)',
          }}
        />
      </div>
      {range && (
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--faint)' }}>
          <span>{range[0]}%</span>
          <span>{range[1]}%</span>
        </div>
      )}
    </div>
  )
}
