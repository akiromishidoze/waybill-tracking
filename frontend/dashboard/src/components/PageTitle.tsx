import { useEffect } from 'react'

interface PageTitleProps {
  title: string
  suffix?: string
}

export default function PageTitle({ title, suffix = 'Waybill Tracking' }: PageTitleProps) {
  useEffect(() => {
    const originalTitle = document.title
    document.title = `${title} — ${suffix}`
    return () => {
      document.title = originalTitle
    }
  }, [title, suffix])

  return null
}
