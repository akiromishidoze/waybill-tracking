import { useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Paperclip, FileText, Download, Trash2, Upload } from 'lucide-react'
import { attachmentService } from '@/services/api'
import type { Attachment } from '@/types/waybill'
import ConfirmModal from '@/components/ConfirmModal'
import { formatFileSize } from '@/utils/format'

export default function AttachmentsTab({ waybillId }: { waybillId: string }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deleteAttachId, setDeleteAttachId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments', waybillId],
    queryFn: () => attachmentService.list(waybillId).then(r => r.data),
  })

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.delete(attachmentId),
    onSuccess: () => refetchAttachments(),
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        await attachmentService.upload(waybillId, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: base64,
        })
        refetchAttachments()
      } catch { setUploadError('Upload failed. Please try again.') }
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Paperclip size={18} color='var(--color-text-muted)' />
            <h3 style={{ fontWeight: 600 }}>Proof of Delivery Attachments</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>({attachments?.length || 0})</span>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
              <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
            {uploadError && <p style={{ fontSize: '0.75rem', color: 'var(--badge-red-text)', marginTop: '0.375rem' }}>{uploadError}</p>}
          </div>
        </div>
        {(!attachments || attachments.length === 0) ? (
          <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>No attachments yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attachments.map((att: Attachment) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <FileText size={16} color='var(--color-text-muted)' />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', margin: 0 }}>{formatFileSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => { const a = document.createElement('a'); a.href = `data:${att.fileType};base64,${att.data}`; a.download = att.fileName; a.click() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => setDeleteAttachId(att.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'var(--color-surface)', border: '1px solid var(--badge-red-border)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--badge-red-text)' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={deleteAttachId !== null}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        onConfirm={() => { if (deleteAttachId) deleteAttachment.mutate(deleteAttachId); setDeleteAttachId(null) }}
        onCancel={() => setDeleteAttachId(null)}
      />
    </div>
  )
}
