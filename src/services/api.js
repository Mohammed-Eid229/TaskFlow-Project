import axios from "axios"
import { TOKEN_KEY, USER_KEY } from "../constants/storage"


const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000/api"

const realApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// 🔐 Request interceptor
realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
    config.headers.Authorization = `Bearer ${cleanToken}`
  }
  return config
})

// ⚠️ Response interceptor
realApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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