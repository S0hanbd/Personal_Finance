import { useState, useEffect, useRef } from 'react'
import { Camera, User, Check, AlertCircle } from 'lucide-react'
import { useUserProfile, useUpdateProfile } from '@/hooks/useSettingsQueries'
import type { UserProfile } from '@/types'

export function ProfileSettings() {
  const { data: profile, isLoading } = useUserProfile()
  const updateProfile = useUpdateProfile()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
      setPhone(profile.phone)
      setBio(profile.bio)
      setAvatarPreview(profile.profile_picture_url)
    }
  }, [profile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be less than 5MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Only image files are allowed.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const formData = new FormData()
    let hasChanges = false
    if (firstName !== (profile?.first_name ?? '')) { formData.append('first_name', firstName); hasChanges = true }
    if (lastName !== (profile?.last_name ?? '')) { formData.append('last_name', lastName); hasChanges = true }
    if (phone !== (profile?.phone ?? '')) { formData.append('phone', phone); hasChanges = true }
    if (bio !== (profile?.bio ?? '')) { formData.append('bio', bio); hasChanges = true }

    const fileInput = fileInputRef.current
    if (fileInput?.files?.[0]) {
      formData.append('profile_picture', fileInput.files[0])
      hasChanges = true
    }

    if (!hasChanges) {
      setErrorMessage('No changes to save.')
      return
    }

    updateProfile.mutate(formData, {
      onSuccess: (data: UserProfile) => {
        setSuccessMessage('Profile updated successfully.')
        setAvatarPreview(data.profile_picture_url)
        setTimeout(() => setSuccessMessage(null), 3000)
      },
      onError: () => {
        setErrorMessage('Failed to update profile. Please try again.')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-20 w-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="w-full h-full text-muted-foreground p-4" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <Camera size={16} className="text-white" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{profile?.username}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

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

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first-name" className="block text-xs font-medium text-foreground mb-0.5">
            First name
          </label>
          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="last-name" className="block text-xs font-medium text-foreground mb-0.5">
            Last name
          </label>
          <input
            id="last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-foreground mb-0.5">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+880 1XXX-XXXXXX"
          autoComplete="tel"
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-xs font-medium text-foreground mb-0.5">
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio..."
          className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[24px]"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
