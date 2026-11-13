export interface User {
  id: number
  username: string
  email: string
  timezone: string
  default_currency: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access: string
  refresh: string
}
