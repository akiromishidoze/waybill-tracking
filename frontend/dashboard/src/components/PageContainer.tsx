import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageContainer({ title, actions, children }: PageContainerProps) {
  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  )
}
