import { Download, Upload } from 'lucide-react'
import { format } from 'date-fns'
import type { Attachment } from '../../types/models'
import { Button } from '../common/Button'

interface AttachmentListProps {
  attachments: Attachment[]
  onUpload: (file: File) => Promise<void>
}

export function AttachmentList({ attachments, onUpload }: AttachmentListProps) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <Upload size={16} /> Upload attachment
        <input
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) {
              return
            }
            void onUpload(file)
            event.target.value = ''
          }}
        />
      </label>

      {attachments.map((attachment) => (
        <div key={attachment.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-800">{attachment.fileName}</p>
              <p className="text-xs text-slate-500">
                {(attachment.size / 1024 / 1024).toFixed(2)} MB · {format(new Date(attachment.createdAt), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const url = URL.createObjectURL(attachment.blob)
                const anchor = document.createElement('a')
                anchor.href = url
                anchor.download = attachment.fileName
                anchor.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download size={14} /> Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
