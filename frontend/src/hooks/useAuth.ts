import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { LoginRequest, RegisterRequest } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

  const login = async (credentials: LoginRequest) => {
    const response = await api.post('/auth/login/', credentials)
    setAuth(response.data.user, response.data.access, response.data.refresh)
    return response.data
  }

  const register = async (data: RegisterRequest) => {
    const response = await api.post('/auth/register/', data)
    setAuth(response.data.user, response.data.access, response.data.refresh)
    return response.data
  }

  const logout = () => clearAuth()

  return { user, isAuthenticated, login, register, logout }
}

