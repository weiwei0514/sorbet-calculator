import type { CSSProperties, ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <tr className={`border-b ${className}`} style={{ borderColor: 'var(--rule)', ...style }}>
      {children}
    </tr>
  )
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`font-mono-label border-b py-3 pr-4 text-left text-[10px] font-normal ${className}`}
      style={{ borderColor: 'var(--ink)', color: 'var(--faint)' }}
    >
      {children}
    </th>
  )
}

export function TD({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <td className={`py-3 pr-4 ${className}`} style={{ color: 'var(--ink)', ...style }}>
      {children}
    </td>
  )
}
