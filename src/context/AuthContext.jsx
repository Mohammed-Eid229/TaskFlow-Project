import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { login as loginRequest, register as registerRequest } from "../services/authService"
import { TOKEN_KEY, USER_KEY } from "../constants/storage"
import { normalizeAuthPayload, roleLabel } from "../utils/authResponse"
import { getApiErrorParts } from "../utils/apiError"
import {
  buildMockSession,
  inferMockRoleFromEmail,
  isMockAuthEnabled,
} from "../utils/mockAuth"
import { createUserWithOptionalPmRequest, getMockRoleByEmail } from "../data/adminStore"
import { getMyProfile } from "../services/userService"

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    return u && typeof u === "object" ? u : null
  } catch {
    return null
  }
}

// Decode JWT payload without verifying signature (client-side only).
function decodeJwt(token) {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      Math.ceil(part.length / 4) * 4,
      "="
    )
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

// Extract role from JWT claims — .NET Identity uses the long claim URI or "role".
function getRoleFromToken(token) {
  const claims = decodeJwt(token)
  if (!claims) return null
  return (
    claims.role ||
    claims.Role ||
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    null
  )
}

// Extract name from JWT claims.
function getNameFromToken(token) {
  const claims = decodeJwt(token)
  if (!claims) return null
  return (
    claims.name ||
    claims.unique_name ||
    claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    null
  )
}

// Try JWT first (fast, no network), then fall back to profile API.
async function hydrateProfileInto(token, baseUser, persistSession) {
  // 1. Try reading role from the JWT itself (no network needed).
  const roleFromToken = getRoleFromToken(token)
  const nameFromToken = getNameFromToken(token)

  if (roleFromToken) {
    persistSession(token, {
      ...baseUser,
      fullName: nameFromToken || baseUser?.fullName || baseUser?.email || "",
      role: roleFromToken,
    })
    return
  }

  // 2. JWT had no role — try the profile API.
  try {
    const profileRes = await getMyProfile()

    // API shape: { data: { name, role, email, status, id } }
    const raw =
      profileRes?.data?.data ??
      profileRes?.data ??
      profileRes

    if (!raw || typeof raw !== "object") return

    const profileRole = raw.role || raw.roleName || baseUser?.role || ""
    const profileName = raw.name || raw.fullName || raw.userName || baseUser?.fullName || ""
    const profileEmail = raw.email || baseUser?.email || ""

    if (!profileRole) {
      console.warn("[AuthContext] Profile API returned no role. User will have no role assigned.")
      return
    }

    persistSession(token, {
      ...baseUser,
      email: profileEmail,
      fullName: profileName,
      role: profileRole,
    })
  } catch (err) {
    console.error(
      "[AuthContext] getMyProfile failed — role will be missing:",
      err?.response?.status,
      err?.message
    )
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  const persistSession = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)

    if (nextUser) {
      const normalized = {
        ...nextUser,
        displayRole: roleLabel(nextUser.role),
      }
      localStorage.setItem(USER_KEY, JSON.stringify(normalized))
      setUser(normalized)
    } else {
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
    setToken(nextToken || null)
  }, [])

  const login = useCallback(
    async ({ email, password }) => {
      setLoading(true)
      try {
        if (isMockAuthEnabled()) {
          const trimmed = email.trim()
          const roleFromAdminStore = getMockRoleByEmail(trimmed)
          const { token: t, user: u } = buildMockSession({
            email: trimmed,
            fullName: trimmed.split("@")[0] || "User",
            role: roleFromAdminStore || inferMockRoleFromEmail(trimmed),
          })
          persistSession(t, u)
          return { ok: true }
        }

        const res = await loginRequest({ email, password })
        const { token: t, user: u } = normalizeAuthPayload(res, { email })

        if (!t) {
          throw new Error("Server did not return a token. Check the login API response shape.")
        }

        // Persist basic session immediately so the user is logged in.
        persistSession(t, u || { email })

        // Enrich with role from JWT or profile API.
        await hydrateProfileInto(t, u || { email }, persistSession)

        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          error: getApiErrorParts(err, "Sign in failed"),
        }
      } finally {
        setLoading(false)
      }
    },
    [persistSession]
  )

  const register = useCallback(
    async ({ fullName, email, password, role }) => {
      setLoading(true)
      try {
        if (isMockAuthEnabled()) {
          const wantsPm = role === "ProjectManager"
          const { user: adminStoreUser, pendingCreated } =
            createUserWithOptionalPmRequest({ fullName, email, wantsPm })
          const sessionRole = wantsPm ? "TeamMember" : role
          const { token: t, user: u } = buildMockSession({
            email: adminStoreUser.email,
            fullName: adminStoreUser.name,
            role: sessionRole,
          })
          persistSession(t, u)
          return { ok: true, needsLogin: false, pendingPmApproval: pendingCreated }
        }

        const res = await registerRequest({ fullName, email, password, role })
        const { token: t, user: u } = normalizeAuthPayload(res, { email, fullName, role })

        if (t && u) {
          persistSession(t, u)
          await hydrateProfileInto(t, u, persistSession)
        }

        return { ok: true, needsLogin: !t }
      } catch (err) {
        return {
          ok: false,
          error: getApiErrorParts(err, "Registration failed"),
        }
      } finally {
        setLoading(false)
      }
    },
    [persistSession]
  )

  const logout = useCallback(() => {
    persistSession(null, null)
  }, [persistSession])

  const updateProfile = useCallback(
    (patch) => {
      if (!user || !token) return
      persistSession(token, { ...user, ...patch })
    },
    [user, token, persistSession]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      mockAuth: isMockAuthEnabled(),
      loading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, token, loading, login, register, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
