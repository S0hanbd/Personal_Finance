import { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { useChangePassword } from '@/hooks/useSettingsQueries'
import type { PasswordChange } from '@/types'

export function PasswordSettings() {
  const changePassword = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword1, setNewPassword1] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword1 !== newPassword2) {
      setErrorMessage('Passwords do not match.')
      return
    }
    if (newPassword1.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    const payload: PasswordChange = {
      current_password: currentPassword,
      new_password1: newPassword1,
      new_password2: newPassword2,
    }

    changePassword.mutate(payload, {
      onSuccess: () => {
        setSuccessMessage('Password changed successfully.')
        setCurrentPassword('')
        setNewPassword1('')
        setNewPassword2('')
        setTimeout(() => setSuccessMessage(null), 3000)
      },
      onError: () => {
        setErrorMessage('Failed to change password. Please check your current password.')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {/* Messages */}
      {errorMessage && (
        <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div role="status" className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-start gap-2 text-sm text-success">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current password */}
      <div>
        <label htmlFor="current-password" className="block text-xs font-medium text-foreground mb-0.5">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* New password */}
      <div>
        <label htmlFor="new-password1" className="block text-xs font-medium text-foreground mb-0.5">
          New password
        </label>
        <input
          id="new-password1"
          type="password"
          value={newPassword1}
          onChange={(e) => setNewPassword1(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Confirm new password */}
      <div>
        <label htmlFor="new-password2" className="block text-xs font-medium text-foreground mb-0.5">
          Confirm new password
        </label>
        <input
          id="new-password2"
          type="password"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={changePassword.isPending}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[24px]"
        >
          {changePassword.isPending ? 'Changing...' : 'Change password'}
        </button>
      </div>
    </form>
  )
}
