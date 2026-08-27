export function IngredientSearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="搜尋食材名稱…"
      className="w-full border-b bg-transparent py-2 text-base outline-none sm:max-w-[220px] sm:py-1.5 sm:text-sm"
      style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
    />
  )
}
