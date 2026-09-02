'use client'

import { useState } from 'react'
import type { GelatoInputs, GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { createClient } from '@/lib/supabase/client'
import { extractSupabaseMessage } from '@/lib/supabase/errors'
import { createSavedGelatoRecipe } from '@/lib/savedRecipes/mutations'
import { Button } from '@/components/ui/Button'

const NOT_CONFIGURED_MESSAGE =
  '無法連線到資料庫，請確認 .env.local 是否已填入正確的 Supabase 金鑰，並已在 Supabase 執行過 supabase/migrations/ 下的 SQL（含 0007_saved_recipe_kind.sql）。'

export function SaveGelatoRecipeButton({
  inputs,
  recipe,
}: {
  inputs: GelatoInputs
  recipe: GelatoRecipeSnapshot
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('請輸入配方名稱')
      return
    }
    setErrorMessage(null)
    setSubmitting(true)
    try {
      await createSavedGelatoRecipe(createClient(), { name: name.trim(), note: note.trim(), inputs, result: recipe })
      setSavedName(name.trim())
      setName('')
      setNote('')
      setOpen(false)
    } catch (err) {
      console.error(err)
      const detail = extractSupabaseMessage(err)
      setErrorMessage(detail ? `儲存失敗：${detail}` : NOT_CONFIGURED_MESSAGE)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setOpen(true)
            setSavedName(null)
          }}
        >
          儲存配方
        </Button>
        {savedName && (
          <p className="text-xs" style={{ color: 'var(--accent)' }}>
            已儲存「{savedName}」，可以到「已儲存配方」分頁的 GELATO 查看。
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3 border-l-2 py-2 pl-6" style={{ borderColor: 'var(--accent)' }}>
      <label className="flex flex-col gap-2">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          配方名稱
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：開心果 Gelato 基底"
          autoFocus
          className="w-full border-b bg-transparent pb-1.5 text-base outline-none"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          備註（選填）
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如：這批脂肪偏低，下次奶油上限拉到 12%"
          rows={2}
          className="w-full resize-y border-b bg-transparent pb-1.5 text-base outline-none"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
        />
      </label>

      {errorMessage && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          確認儲存
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setErrorMessage(null)
          }}
        >
          取消
        </Button>
      </div>
    </form>
  )
}
