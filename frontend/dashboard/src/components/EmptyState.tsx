import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  message?: string
  children?: React.ReactNode
  style?: CSSProperties
}

export default function EmptyState({
  icon: Icon,
  title = 'No data',
  message = 'There is nothing to show here.',
  children,
  style,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <Icon size={24} color="var(--color-text-muted-lighter)" />
        </div>
      )}
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, marginBottom: '0.25rem' }}>
        {title}
      </p>
      {message && (
        <p style={{ fontSize: '0.8125rem', margin: 0, maxWidth: 320 }}>{message}</p>
      )}
      {children}
    </div>
  )
}
