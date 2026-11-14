import { X, Keyboard } from 'lucide-react'
import { type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Group shortcuts into navigation and actions
  const navShortcuts = shortcuts.filter(s => s.key.startsWith('G then'))
  const actionShortcuts = shortcuts.filter(s => !s.key.startsWith('G then'))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-muted-foreground" />
            <h2 id="shortcuts-help-title" className="text-lg font-bold text-foreground">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5">
          {/* Navigation shortcuts */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Navigation (press G, then the key)
            </h3>
            <dl className="space-y-1.5">
              {navShortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50"
                >
                  <dt>
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                  </dt>
                  <dd>
                    <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-mono font-medium text-foreground bg-muted rounded border border-border">
                      {shortcut.key}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Action shortcuts */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Actions
            </h3>
            <dl className="space-y-1.5">
              {actionShortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50"
                >
                  <dt>
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                  </dt>
                  <dd>
                    <kbd className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium text-foreground bg-muted rounded border border-border">
                      {shortcut.key}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-3 bg-muted/50 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Shortcuts are disabled while typing in input fields
          </p>
        </div>
      </div>
    </div>
  )
}
