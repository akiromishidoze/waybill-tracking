import { useQuery } from '@tanstack/react-query'
import { erpIntegrationService } from '@/services/api'
import type { ErpIntegration } from '@/types/waybill'
import { Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'

const SYSTEM_COLORS: Record<string, string> = { SAP: '#1a73e8', ORACLE: '#f80000', NETSUITE: '#1a8cff', OTHER: '#64748b' }

export default function ErpIntegrationsPage() {
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['erp-integrations'],
    queryFn: () => erpIntegrationService.list().then(r => r.data),
  })

  return (
    <PageContainer title="ERP Integrations">
      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
      ) : !integrations?.length ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
          <Database size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No ERP integrations configured</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {integrations.map((i: ErpIntegration) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: (SYSTEM_COLORS[i.system] || '#64748b') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} color={SYSTEM_COLORS[i.system] || '#64748b'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {i.name}
                  {i.lastSyncStatus === 'SUCCESS' ? <CheckCircle size={14} color="#16a34a" /> : i.lastSyncStatus === 'FAILED' ? <XCircle size={14} color="#dc2626" /> : null}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span>{i.system}</span>
                  <span>{i.authType}</span>
                  <span>{i.syncDirection}</span>
                  {i.lastSyncAt && <span>Last sync: {new Date(i.lastSyncAt).toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <RefreshCw size={14} color={i.isActive ? '#16a34a' : '#94a3b8'} />
                <span style={{ color: i.isActive ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>{i.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
