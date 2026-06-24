import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UploadCloud, CheckCircle, XCircle, Download, FileSpreadsheet } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { waybillService } from '@/services/api'

const CSV_TEMPLATE = `trackingNumber,recipientName,recipientAddress,recipientPhone,recipientEmail,origin,destination,weight,dimensions,serviceType,carrierName,referenceNumber,teamId
,John Doe,123 Main St,09171234567,john@example.com,Manila,Cebu,2.5,10x10x10,Standard,J&T Express,REF-001,
,Jane Smith,456 Oak Ave,09187654321,jane@example.com,Cebu,Davao,1.2,5x5x5,Express,LBC,REF-002,`

export default function WaybillImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)

  const importMutation = useMutation({
    mutationFn: (formData: FormData) => waybillService.importCSV(formData),
    onSuccess: (res) => {
      setResult(res.data)
      setFile(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    importMutation.mutate(formData)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'waybill_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900 }}>
      <BackButton fallback="/waybills" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bulk Import Waybills</h1>
        <button
          onClick={downloadTemplate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          <Download size={16} /> Download Template
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet size={18} color="var(--color-primary)" /> CSV Format
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Required columns: <b>recipientName, recipientAddress, recipientPhone, origin, destination</b>.<br />
          Optional: trackingNumber, recipientEmail, weight, dimensions, serviceType, carrierName, referenceNumber, teamId.
          Leave trackingNumber blank to auto-generate.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
        <div
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 10,
            padding: '2rem',
            textAlign: 'center',
            background: file ? 'var(--color-bg)' : 'transparent',
            marginBottom: '1rem',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('csv-upload')?.click()}
        >
          <UploadCloud size={36} color="var(--color-primary)" style={{ marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
            {file ? file.name : 'Click or drag a CSV file here'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Only .csv files are supported</div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={!file || importMutation.isPending}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: file ? 'var(--color-primary)' : 'var(--color-border)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: file ? 'pointer' : 'not-allowed',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          {importMutation.isPending ? 'Importing...' : 'Import Waybills'}
        </button>
      </form>

      {result && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', background: 'var(--status-green)10', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={24} color="var(--status-green)" />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-green)' }}>{result.created}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Created</div>
              </div>
            </div>
            <div style={{ flex: 1, padding: '1rem', background: result.failed > 0 ? 'var(--status-red)10' : 'var(--color-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <XCircle size={24} color={result.failed > 0 ? 'var(--status-red)' : 'var(--color-text-muted)'} />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: result.failed > 0 ? 'var(--status-red)' : 'var(--color-text-muted)' }}>{result.failed}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Failed</div>
              </div>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Errors</h4>
              <div style={{ maxHeight: 200, overflow: 'auto', background: 'var(--color-bg)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8125rem' }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ color: 'var(--status-red)', marginBottom: '0.25rem' }}>{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
