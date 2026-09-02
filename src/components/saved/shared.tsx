'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractSupabaseMessage } from '@/lib/supabase/errors'
import { updateSavedRecipeNote } from '@/lib/savedRecipes/mutations'
import { Button } from '@/components/ui/Button'

export function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })
}

export function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Inline 備註 editor shared by both recipe kinds. Writes back to saved_recipes.note. */
export function NoteEditor({
  recipeId,
  note,
  onSaved,
}: {
  recipeId: string
  note: string
  onSaved: (note: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    const next = draft.trim()
    try {
      await updateSavedRecipeNote(createClient(), recipeId, next)
      onSaved(next)
      setEditing(false)
    } catch (e) {
      console.error(e)
      const detail = extractSupabaseMessage(e)
      setError(detail ? `儲存失敗：${detail}` : '無法連線到資料庫，請確認 Supabase 設定是否正確。')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5 border-l-2 pl-4" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
            備註
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(note)
              setError(null)
              setEditing(true)
            }}
            className="font-mono-label text-[10px]"
            style={{ color: 'var(--accent)' }}
          >
            {note ? '編輯' : '+ 新增備註'}
          </button>
        </div>
        {note ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
            {note}
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--faint)' }}>
            尚無備註
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 border-l-2 pl-4" style={{ borderColor: 'var(--accent)' }}>
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        備註
      </span>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        placeholder="例如：客人反映偏甜，下次砂糖再減 15g"
        className="w-full resize-y rounded-md border bg-transparent p-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
      />
      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={save} disabled={saving}>
          {saving ? '儲存中…' : '儲存'}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
          取消
        </Button>
      </div>
    </div>
  )
}
