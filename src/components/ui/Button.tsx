import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost'
}

const BASE = 'font-mono-label text-[10px] px-5 py-2.5 transition-colors disabled:opacity-40'

export function Button({ variant = 'solid', className = '', style, ...props }: ButtonProps) {
  const variantStyle =
    variant === 'solid'
      ? { background: 'var(--wine)', color: 'var(--surface)' }
      : variant === 'outline'
        ? { background: 'transparent', color: 'var(--wine)', border: '1px solid var(--wine)' }
        : { background: 'transparent', color: 'var(--muted)' }

  return <button className={`${BASE} ${className}`} style={{ ...variantStyle, ...style }} {...props} />
}
