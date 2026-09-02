'use client'

import { useEffect, useState } from 'react'
import type { Ingredient } from '@/lib/calculator/types'
import { CalculatorApp } from './CalculatorApp'
import { GelatoCalculator } from '@/components/gelato/GelatoCalculator'

type Mode = 'sorbet' | 'gelato'

const STORAGE_KEY = 'calculator-mode'

function readStoredMode(): Mode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'sorbet' || v === 'gelato') return v
  } catch {
    // private window / storage disabled — fall through to the default
  }
  return 'sorbet'
}

export function CalculatorModeSwitch({
  initialIngredients,
  isDemo = false,
}: {
  initialIngredients: Ingredient[]
  isDemo?: boolean
}) {
  // Always render 'sorbet' first (matches SSR); adopt the stored choice after mount
  // to avoid a hydration mismatch. Reading localStorage during an effect is the
  // intended pattern here, hence the rule suppression.
  const [mode, setMode] = useState<Mode>('sorbet')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(readStoredMode())
  }, [])

  function choose(next: Mode) {
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-10">
        <div
          className="inline-flex overflow-hidden rounded-md border"
          style={{ borderColor: 'var(--rule)' }}
          role="tablist"
          aria-label="計算機模式"
        >
          {(['sorbet', 'gelato'] as const).map((m) => {
            const active = mode === m
            return (
              <button
                key={m}
                role="tab"
                aria-selected={active}
                onClick={() => choose(m)}
                className="font-mono-label min-h-11 px-6 text-sm transition-colors"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--on-accent)' : 'var(--muted)',
                }}
              >
                {m === 'sorbet' ? 'SORBET' : 'GELATO'}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'sorbet' ? (
        <CalculatorApp initialIngredients={initialIngredients} isDemo={isDemo} />
      ) : (
        <GelatoCalculator initialIngredients={initialIngredients} isDemo={isDemo} />
      )}
    </>
  )
}
