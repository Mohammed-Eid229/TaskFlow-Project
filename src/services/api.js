import axios from "axios"
import { TOKEN_KEY, USER_KEY } from "../constants/storage"


const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5183/api"

const realApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
    config.headers.Authorization = `Bearer ${cleanToken}`
  }
  return config
})

// Response interceptor
realApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ""
    
    // Don't auto-logout for 401 on login or change-password
    const isAuthPath = url.includes("/login") || url.includes("/change-password")

    if (status === 401 && !isAuthPath) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      const path = window.location.pathname
      if (path !== "/login" && path !== "/register") {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  }
)

const api = realApi

export default api