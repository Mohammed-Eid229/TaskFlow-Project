/**
 * Normalizes common ASP.NET JWT login/register response shapes.
 * Team can align backend to one of these or extend this helper.
 */
export function normalizeAuthPayload(data, fallback = {}) {
  const token =
    data?.token ??
    data?.accessToken ??
    data?.access_token ??
    data?.jwt

  let user = data?.user ?? data?.userDto ?? data?.userInfo ?? null

  if (!user && fallback.email) {
    user = {
      email: fallback.email,
      fullName: fallback.fullName ?? data?.fullName ?? "",
      role: data?.role ?? fallback.role ?? "",
    }
  }

  if (user && typeof user === "object") {
    user = {
      ...user,
      fullName: user.fullName ?? user.name ?? user.userName ?? "",
      email: user.email ?? user.userName ?? fallback.email ?? "",
      role: user.role ?? fallback.role ?? "",
    }
  }

  return { token, user }
}

export function roleLabel(role) {
  if (!role && role !== 0) return "User"
  const r = String(role)
  const map = {
    Admin: "Admin",
    admin: "Admin",
    ProjectManager: "Project Manager",
    projectManager: "Project Manager",
    Project_Manager: "Project Manager",
    manager: "Project Manager",
    TeamMember: "Team Member",
    teamMember: "Team Member",
    member: "Team Member",
  }
  return map[r] || r
}
