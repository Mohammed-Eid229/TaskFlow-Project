function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

function pickFirst(obj, paths) {
  for (const path of paths) {
    const value = getByPath(obj, path)
    if (value !== undefined && value !== null && value !== "") return value
  }
  return null
}

function collectObjects(input, acc = []) {
  if (!input || typeof input !== "object") return acc
  acc.push(input)
  if (Array.isArray(input)) {
    input.forEach((item) => collectObjects(item, acc))
    return acc
  }
  Object.values(input).forEach((value) => collectObjects(value, acc))
  return acc
}

function findByKeyCandidates(input, candidates) {
  const keys = candidates.map((c) => String(c).toLowerCase())
  const objects = collectObjects(input, [])
  for (const obj of objects) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) continue
    const entries = Object.entries(obj)
    for (const [key, value] of entries) {
      if (keys.includes(String(key).toLowerCase()) && value) return value
    }
  }
  return null
}

function findJwtLikeString(input) {
  const jwtRegex = /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
  if (typeof input === "string") {
    const directMatch = input.match(jwtRegex)
    if (directMatch?.[0]) return directMatch[0]
    try {
      const parsed = JSON.parse(input)
      return findJwtLikeString(parsed)
    } catch {
      return null
    }
  }
  const objects = collectObjects(input, [])
  for (const obj of objects) {
    if (typeof obj === "string") {
      const match = obj.match(jwtRegex)
      if (match?.[0]) return match[0]
      continue
    }
    if (!obj || typeof obj !== "object") continue
    if (Array.isArray(obj)) continue
    for (const value of Object.values(obj)) {
      if (typeof value !== "string") continue
      const match = value.match(jwtRegex)
      if (match?.[0]) return match[0]
    }
  }
  return null
}

function extractBearerToken(headers) {
  const candidates = [
    headers?.authorization,
    headers?.Authorization,
    headers?.["x-access-token"],
    headers?.["X-Access-Token"],
    headers?.["x-auth-token"],
    headers?.["X-Auth-Token"],
    headers?.token,
    headers?.Token,
  ]
  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue
    if (raw.toLowerCase().startsWith("bearer ")) return raw.slice(7).trim()
    if (/^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw.trim())) {
      return raw.trim()
    }
  }
  return null
}

function normalizeToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") return null
  return rawToken.replace(/^Bearer\s+/i, "").trim()
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=")
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

// Main function to normalize various auth response shapes into { token, user }.
export function normalizeAuthPayload(responseOrData, fallback = {}) { 
  const data =
    responseOrData && typeof responseOrData === "object" && "data" in responseOrData
      ? responseOrData.data
      : responseOrData
  const headers =
    responseOrData && typeof responseOrData === "object" && "headers" in responseOrData
      ? responseOrData.headers
      : null

  const tokenRaw =
    pickFirst(data, [
      "token.result",
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "jwtToken",
      "bearerToken",
      "data.token",
      "data.accessToken",
      "data.jwt",
      "result.accessToken",
      "result.jwt",
      "payload.token",
      "payload.accessToken",
      "payload.jwt",
      "Token",
      "AccessToken",
      "JWT",
      "Data.Token",
      "Result.Token",
    ]) ??
    findByKeyCandidates(data, [
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "jwtToken",
      "bearerToken",
      "id_token",
      "idToken",
      "authToken",
      "authenticationToken",
    ]) ??
    (typeof data === "string" ? extractBearerToken({ token: data }) : null) ??
    findJwtLikeString(data) ??
    extractBearerToken(headers)

  const token = normalizeToken(tokenRaw)
  const tokenClaims = token ? decodeJwtPayload(token) : null

  const roleFromClaims =
    pickFirst(tokenClaims, [
      "role",
      "roles.0",
      "roles",
      "Role",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    ]) ?? null

  const fullNameFromClaims =
    pickFirst(tokenClaims, [
      "name",
      "unique_name",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    ]) ?? ""

  let user =
    pickFirst(data, [
      "user", "userDto", "userInfo",
      "data.user", "data.userDto", "data.userInfo",
      "result.user", "result.userDto", "result.userInfo",
      "payload.user", "User", "Data.User", "Result.User",
    ]) ??
    findByKeyCandidates(data, [
      "user", "userDto", "userInfo", "profile", "account", "loggedInUser",
    ])

  if (!user && fallback.email) {
    user = {
      email: fallback.email,
      fullName: fallback.fullName || fullNameFromClaims || "",
      role: roleFromClaims || fallback.role || "",
    }
  }

  if (user && typeof user === "object") {
    user = {
      ...user,
      fullName: user.fullName || user.name || user.userName || fullNameFromClaims || "",
      email: user.email || user.userName || fallback.email || "",
      role: user.role || user.roleName || user.userRole || roleFromClaims || fallback.role || "",
      profileImageUrl: user.profileImageUrl || user.ProfileImageUrl || user.image || user.photo || user.imagePath || "",
    }
  }

  if (user && !user.profileImageUrl) {
    const imgFromData = findByKeyCandidates(data, ["profileImageUrl", "image", "photo", "ProfileImageUrl"])
    if (imgFromData) user.profileImageUrl = imgFromData
  }

  return { token, user }
}

export function roleLabel(role) {
  if (!role && role !== 0) return "User"
  const r = String(role)
  const compact = r.toLowerCase().replace(/[\s_-]/g, "")
  const map = {
    "0": "Admin",
    "1": "Project Manager",
    "2": "Team Member",
    Admin: "Admin",
    admin: "Admin",
    ProjectManager: "Project Manager",
    projectManager: "Project Manager",
    Project_Manager: "Project Manager",
    "Project Manager": "Project Manager",
    PM: "Project Manager",
    pm: "Project Manager",
    manager: "Project Manager",
    User: "Team Member",
    user: "Team Member",
    TeamMember: "Team Member",
    teamMember: "Team Member",
    member: "Team Member",
  }
  if (map[r]) return map[r]
  if (compact === "admin") return "Admin"
  if (compact === "projectmanager" || compact === "pm" || compact === "manager") return "Project Manager"
  if (compact === "teammember" || compact === "member" || compact === "user") return "Team Member"
  return r
}
