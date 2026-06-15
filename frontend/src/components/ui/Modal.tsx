import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-full rounded-xl border border-app bg-app-elevated p-0 shadow-app-lg backdrop:bg-black/50',
        sizes[size],
        'open:animate-in open:fade-in-0',
      )}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div className="flex items-start justify-between border-b border-app px-6 py-4">
        <div>
          <h2 id="modal-title" className="text-lg font-semibold text-app">
            {title}
          </h2>
          {description && (
            <p id="modal-description" className="mt-1 text-sm text-app-secondary">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-app px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  )
}
