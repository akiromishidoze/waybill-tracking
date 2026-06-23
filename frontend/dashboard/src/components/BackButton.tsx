import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  fallback?: string
}

export default function BackButton({ fallback = '/dashboard' }: Props) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(fallback) }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.375rem 0.75rem', borderRadius: 6, border: '1px solid var(--color-border)',
        background: 'var(--color-surface)', color: 'var(--color-text-muted)',
        fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '1rem',
      }}
    >
      <ArrowLeft size={15} /> Back
    </button>
  )
}