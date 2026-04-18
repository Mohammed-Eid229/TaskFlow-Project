import { initialMockUsers, nextMockUserId } from "./adminMock"

const USERS_KEY = "tf_admin_users"
const PM_PENDING_KEY = "tf_pending_pm_requests"

const seededPending = [
  {
    id: "pm-101",
    userId: 3,
    name: "Omar Khaled",
    email: "omar@taskflow.dev",
    requestedRole: "pm",
    status: "pending",
    requestedAt: "2026-04-17T10:00:00Z",
  },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getAdminUsers() {
  const users = readJson(USERS_KEY, initialMockUsers)
  if (!localStorage.getItem(USERS_KEY)) {
    writeJson(USERS_KEY, users)
  }
  return users
}

export function saveAdminUsers(users) {
  writeJson(USERS_KEY, users)
}

export function getPendingPmRequests() {
  const pending = readJson(PM_PENDING_KEY, seededPending)
  if (!localStorage.getItem(PM_PENDING_KEY)) {
    writeJson(PM_PENDING_KEY, pending)
  }
  return pending
}

export function savePendingPmRequests(requests) {
  writeJson(PM_PENDING_KEY, requests)
}

export function createUserWithOptionalPmRequest({ fullName, email, wantsPm }) {
  const users = getAdminUsers()
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    return { user: existing, pendingCreated: false }
  }

  const user = {
    id: nextMockUserId(),
    name: fullName.trim(),
    email: email.trim(),
    role: "user",
  }
  const nextUsers = [...users, user]
  saveAdminUsers(nextUsers)

  let pendingCreated = false
  if (wantsPm) {
    const requests = getPendingPmRequests()
    const alreadyPending = requests.some(
      (r) => r.email.toLowerCase() === user.email.toLowerCase() && r.status === "pending"
    )
    if (!alreadyPending) {
      const nextRequests = [
        ...requests,
        {
          id: `pm-${Date.now()}`,
          userId: user.id,
          name: user.name,
          email: user.email,
          requestedRole: "pm",
          status: "pending",
          requestedAt: new Date().toISOString(),
        },
      ]
      savePendingPmRequests(nextRequests)
      pendingCreated = true
    }
  }

  return { user, pendingCreated }
}

export function getMockRoleByEmail(email) {
  const users = getAdminUsers()
  const found = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!found) return null
  if (found.role === "admin") return "Admin"
  if (found.role === "pm") return "ProjectManager"
  return "TeamMember"
}
