export function IngredientSearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="搜尋食材名稱…"
      className="w-full max-w-[220px] border-b bg-transparent pb-1.5 text-sm outline-none"
      style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
    />
  )
}
