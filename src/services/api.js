import axios from "axios"
import { TOKEN_KEY, USER_KEY } from "../constants/storage"


// 🌐 Real API (لما يبقى عندك backend)
// const baseURL =
//   import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
//   "http://localhost:5000/api"

const baseURL =""

const USE_FAKE = import.meta.env.VITE_USE_FAKE === "true"

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
    config.headers.Authorization = `Bearer ${token}`
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

// 🎭 Fake API (لما مفيش backend)
const fakeApi = {
  post: async (url, data) => {
    console.log("FAKE POST:", url, data)

    // 🧠 مثال login/register
    if (url.includes("login") || url.includes("register")) {
      const fakeUser = {
        name: data.name || "Test User",
        email: data.email,
      }

      localStorage.setItem(TOKEN_KEY, "fake-token")
      localStorage.setItem(USER_KEY, JSON.stringify(fakeUser))

      return {
        data: {
          success: true,
          user: fakeUser,
          token: "fake-token",
        },
      }
    }

    return { data: {} }
  },

  get: async (url) => {
    console.log("FAKE GET:", url)

    // 🧠 مثال tasks
    if (url.includes("tasks")) {
      return {
        data: [
          { id: 1, title: "Task 1", status: "todo" },
          { id: 2, title: "Task 2", status: "in-progress" },
        ],
      }
    }

    return { data: [] }
  },
}

// 🔁 اختيار الـ API
const api = USE_FAKE ? fakeApi : realApi

export default api