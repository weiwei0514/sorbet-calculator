import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost'
}

const BASE =
  'font-mono-label text-[10px] px-5 min-h-11 inline-flex items-center justify-center transition-colors disabled:opacity-40'

export function Button({ variant = 'solid', className = '', style, ...props }: ButtonProps) {
  const variantStyle =
    variant === 'solid'
      ? { background: 'var(--accent)', color: 'var(--on-accent)' }
      : variant === 'outline'
        ? { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'transparent', color: 'var(--muted)' }

  return <button className={`${BASE} ${className}`} style={{ ...variantStyle, ...style }} {...props} />
}
