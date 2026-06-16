import { useEffect, type CSSProperties } from 'react'

const skeletonStyle: CSSProperties = {
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
  backgroundSize: '200% 100%',
  borderRadius: 6,
}

function injectKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById('skeleton-keyframes')) return
  const style = document.createElement('style')
  style.id = 'skeleton-keyframes'
  style.textContent = `@keyframes skeleton-pulse {
    0% { background-position: 200% 0 }
    100% { background-position: -200% 0 }
  }`
  document.head.appendChild(style)
}

export function SkeletonLine({ width = '100%', height = 16, style: extra }: {
  width?: string | number
  height?: string | number
  style?: CSSProperties
}) {
  useEffect(() => { injectKeyframes() }, [])
  return <div style={{ ...skeletonStyle, width, height, ...extra }} />
}

export function SkeletonBlock({ width = '100%', height = 200, style: extra }: {
  width?: string | number
  height?: string | number
  style?: CSSProperties
}) {
  useEffect(() => { injectKeyframes() }, [])
  return <div style={{ ...skeletonStyle, width, height, borderRadius: 10, ...extra }} />
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  useEffect(() => { injectKeyframes() }, [])
  return (
    <tr style={{ borderTop: '1px solid #f1f5f9' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.75rem 1rem' }}>
          <SkeletonLine width={i === 0 ? 140 : i === 3 ? 100 : 180} />
        </td>
      ))}
    </tr>
  )
}
