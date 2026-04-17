import axios from "axios"
import { TOKEN_KEY, USER_KEY } from "../constants/storage"

export const register = async (data) => {
  console.log("Fake register:", data);

  return {
    success: true,
    user: data
  };
};

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
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

export default api
