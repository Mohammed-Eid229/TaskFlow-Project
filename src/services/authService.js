import { requestWithFallback } from "./requestWithFallback"
import api from "./api"
import { normalizeAuthPayload } from "../utils/authResponse"

const LOGIN_CANDIDATES = ["/user/login", "/User/Login", "/auth/login"]

export const login = async (data) => {
  let lastResponse = null
  let lastError = null

  for (const url of LOGIN_CANDIDATES) {
    try {
      const response = await api.post(url, data)
      lastResponse = response
      const { token } = normalizeAuthPayload(response, { email: data?.email })
      if (!token) continue
      return response
    } catch (error) {
      const status = error?.response?.status
      if (status === 404 || status === 405) {
        lastError = error
        continue
      }
      throw error
    }
  }

  if (lastResponse) return lastResponse
  if (lastError) throw lastError
  throw new Error("No login endpoint candidates were provided.")
}

export const register = (data) => {
  // قسّم fullName لـ firstName + lastName زي ما الـ API بتتوقع
  const nameParts = (data.fullName || "").trim().split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || firstName

  // map الـ role من camelCase لـ "Team Member" / "Admin" / "Project Manager"
  const ROLE_DISPLAY = {
    Admin: "Admin",
    ProjectManager: "Project Manager",
    TeamMember: "Team Member",
  }
  const roleValue = ROLE_DISPLAY[data.role] ?? data.role

  const body = {
    firstName,
    lastName,
    email: data.email,
    password: data.password,
    Role: roleValue,
  }

  return requestWithFallback([
    { method: "post", url: "/user/register", data: body },
    { method: "post", url: "/User/Register", data: body },
    { method: "post", url: "/auth/register", data: body },
  ])
}
