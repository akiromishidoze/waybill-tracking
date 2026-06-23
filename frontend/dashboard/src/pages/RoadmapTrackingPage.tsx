import PageContainer from '@/components/PageContainer'
import BackButton from '@/components/BackButton'

export default function RoadmapTrackingPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Tracking Roadmap">
        <div className="text-center py-20 text-slate-500">
          Content is being updated...
        </div>
      </PageContainer>
    </>
  )
}
