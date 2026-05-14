import { X } from 'lucide-react'
import type { PropsWithChildren } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
}

export function Modal({ open, title, onClose, children }: PropsWithChildren<ModalProps>) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
