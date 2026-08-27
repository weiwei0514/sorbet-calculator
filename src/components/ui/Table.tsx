import type { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-neutral-50 dark:bg-neutral-900">{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</tbody>
}

export function TR({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400 ${className}`}
    >
      {children}
    </th>
  )
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-neutral-800 dark:text-neutral-200 ${className}`}>{children}</td>
}
