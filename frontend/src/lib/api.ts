import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: null | number) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(null)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch(() => Promise.reject(error))
      }
      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/token/refresh/`,
          { refresh: refreshToken }
        )
        const { access, refresh } = response.data
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh || refreshToken)
        originalRequest.headers.Authorization = `Bearer ${access}`
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(401)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
