/** Fake session for UI work while the .NET API is not available. */
const MOCK_TOKEN = "dev-mock-jwt"

export function isMockAuthEnabled() {
  return import.meta.env.VITE_DEV_MOCK_AUTH === "true"
}

/**
 * Dev-only role guess from email so you can test Admin / PM without the API.
 * Examples: admin@… → Admin, pm@… → ProjectManager, else TeamMember.
 */
export function inferMockRoleFromEmail(email) {
  const local = (email || "").split("@")[0]?.toLowerCase() ?? ""
  const full = (email || "").toLowerCase()
  if (full.startsWith("admin@") || local === "admin") return "Admin"
  if (full.startsWith("pm@") || local === "pm") return "ProjectManager"
  return "TeamMember"
}

export function buildMockSession({ email, fullName, role }) {
  return {
    token: MOCK_TOKEN,
    user: {
      email: email ?? "dev@local.test",
      fullName: fullName ?? "Dev User",
      role: role ?? "TeamMember",
    },
  }
}
