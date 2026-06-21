import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportScheduleService } from '@/services/api'
import type { ReportSchedule } from '@/types/waybill'
import { Calendar, FileText, Trash2 } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'

const FREQ_LABELS: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' }
const FORMAT_LABELS: Record<string, string> = { PDF: 'PDF', CSV: 'CSV', EXCEL: 'Excel' }

export default function ScheduledReportsPage() {
  const queryClient = useQueryClient()
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => reportScheduleService.list().then(r => r.data),
  })

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => reportScheduleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
  })

  return (
    <PageContainer title="Scheduled Reports">
      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
      ) : !schedules?.length ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
          <Calendar size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No scheduled reports</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {schedules.map((s: ReportSchedule) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <FileText size={20} color="#2563eb" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span>{FREQ_LABELS[s.frequency] || s.frequency}</span>
                  <span>{FORMAT_LABELS[s.format] || s.format}</span>
                  <span>To: {s.recipients.join(', ')}</span>
                  <span>Active: {s.isActive ? 'Yes' : 'No'}</span>
                  {s.nextScheduledAt && <span>Next: {new Date(s.nextScheduledAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteSchedule.mutate(s.id)}
                disabled={deleteSchedule.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', border: '1px solid var(--badge-red-border)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
