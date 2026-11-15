import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { UserProfile, PasswordChange, UserSettings } from '@/types'

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/auth/profile/')
      return res.data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: FormData): Promise<UserProfile> => {
      const res = await api.patch('/auth/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: PasswordChange) => {
      const res = await api.post('/auth/change_password/', data)
      return res.data
    },
  })
}

export function useUserSettings() {
  return useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const res = await api.get('/auth/settings/')
      return res.data
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<UserSettings>): Promise<UserSettings> => {
      const res = await api.patch('/auth/settings/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })
}
