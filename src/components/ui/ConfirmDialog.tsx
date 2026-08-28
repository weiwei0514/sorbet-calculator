'use client'

import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '確認刪除',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(33, 28, 26, 0.4)' }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-5 border p-6"
        style={{ background: 'var(--bg)', borderColor: 'var(--rule)' }}
      >
        <div className="flex flex-col gap-2">
          <p id="confirm-dialog-title" className="font-display text-xl" style={{ color: 'var(--wine)' }}>
            {title}
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="solid"
            style={{ background: 'var(--danger)' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
