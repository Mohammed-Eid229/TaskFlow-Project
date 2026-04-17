/**
 * Role checks aligned with TaskFlow spec (PM vs Team Member vs Admin).
 * Uses displayRole from AuthContext and raw role from API when present.
 */
function normalizedKey(user) {
  if (!user) return ""
  const raw = user.displayRole ?? user.role ?? ""
  return String(raw).toLowerCase().replace(/[\s_-]/g, "")
}

export function isProjectManager(user) {
  const k = normalizedKey(user)
  return (
    k === "projectmanager" ||
    k === "manager" ||
    user?.displayRole === "Project Manager"
  )
}

export function isTeamMember(user) {
  const k = normalizedKey(user)
  return (
    k === "teammember" ||
    k === "member" ||
    user?.displayRole === "Team Member"
  )
}

export function isAdmin(user) {
  const k = normalizedKey(user)
  return k === "admin" || user?.displayRole === "Admin"
}

/** Only PM may create projects and tasks (per course requirements). */
export function canCreateProjectsAndTasks(user) {
  return isProjectManager(user)
}
