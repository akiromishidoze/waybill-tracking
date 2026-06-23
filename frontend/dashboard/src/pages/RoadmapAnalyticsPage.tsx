import PageContainer from '@/components/PageContainer'
import BackButton from '@/components/BackButton'

export default function RoadmapAnalyticsPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Reports Roadmap">
        <div className="text-center py-20 text-slate-500">
          Content is being updated...
        </div>
      </PageContainer>
    </>
  )
}
