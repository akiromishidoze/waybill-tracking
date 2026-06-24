import { Helmet } from 'react-helmet-async'

interface PageTitleProps {
  title: string
  suffix?: string
}

export default function PageTitle({ title, suffix = 'Waybill Tracking' }: PageTitleProps) {
  return (
    <Helmet>
      <title>{`${title} — ${suffix}`}</title>
    </Helmet>
  )
}
