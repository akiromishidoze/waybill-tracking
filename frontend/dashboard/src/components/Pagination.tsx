import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>
        {from}–{to} of {total}
      </span>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: '0.375rem 0.625rem', borderRadius: 6, border: '1px solid var(--color-border-input)', background: 'var(--color-surface)', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>

        {generatePages(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0.375rem 0.25rem', color: 'var(--color-text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: 6, border: 'none',
                background: p === page ? 'var(--color-primary)' : 'var(--color-surface)',
                color: p === page ? '#fff' : 'var(--color-text-primary)',
                cursor: 'pointer', fontWeight: p === page ? 600 : 400, minWidth: 32,
                border: p === page ? 'none' : '1px solid var(--color-border-input)',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: '0.375rem 0.625rem', borderRadius: 6, border: '1px solid var(--color-border-input)', background: 'var(--color-surface)', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function generatePages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | null)[] = [1]
  if (current > 3) pages.push(null)

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push(null)

  pages.push(total)
  return pages
}
