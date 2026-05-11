/* eslint-disable no-undef */
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
  // 1. Try reading role and other info from the JWT first.
   console.log("[hydrate] baseUser coming in:", baseUser)
  

  const roleFromToken = getRoleFromToken(token)
  const nameFromToken = getNameFromToken(token)

  // 2. We MUST try the profile API regardless to get the latest info like profileImageUrl
  try {
    const profileRes = await getMyProfile()

    const raw =
      profileRes?.data?.data ??
      profileRes?.data ??
      profileRes

    if (raw && typeof raw === "object") {
      const profileRole = raw.role || raw.roleName || raw.Role || roleFromToken || baseUser?.role || ""
      const profileName = raw.name || raw.fullName || raw.userName || raw.Name || raw.FullName || nameFromToken || baseUser?.fullName || ""
      const profileEmail = raw.email || raw.Email || baseUser?.email || ""
      const profileImage = raw.profileImageUrl || raw.ProfileImageUrl || raw.image || raw.photo || raw.imagePath || ""

      if (profileRole) {
        persistSession(token, {
          ...baseUser,
          email: profileEmail,
          fullName: profileName,
          role: profileRole,
          profileImageUrl: profileImage,
        })
        return
      }
    }
  } catch (err) {
    console.error(
      "[AuthContext] getMyProfile failed during hydration:",
      err?.response?.status,
      err?.message
    )
  }

  // Fallback to token info if API fails
  if (roleFromToken) {
  persistSession(token, {
    ...baseUser,
    fullName: nameFromToken || baseUser?.fullName || baseUser?.email || "",
    role: roleFromToken,
    profileImageUrl: "", // never bleed old image through here
  })
}

  // ... after API call ...
  console.log("[hydrate] raw from API:", raw)
  console.log("[hydrate] profileImage resolved to:", profileImage)
}


//to handle authentication state and provide login, registration, logout, and profile update functions to the app.
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

        if (!t) throw new Error("Server did not return a token.")

        localStorage.removeItem(USER_KEY) // wipe previous user before writing new session

        persistSession(t, u || { email })
        await hydrateProfileInto(t, u || { email }, persistSession)

        // Enrich with role from JWT or profile API.
        // await hydrateProfileInto(t, u || { email }, persistSession)

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
  localStorage.removeItem(TOKEN_KEY)  // explicit clear
  localStorage.removeItem(USER_KEY)   // explicit clear
  persistSession(null, null)
}, [persistSession])

  const updateUser = useCallback((newData) => {
    if (!user) return
    const nextUser = { ...user, ...newData }
    persistSession(token, nextUser)
  }, [user, token, persistSession])

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
      updateUser,
      refreshUser: async () => {
        if (token && user) {
          await hydrateProfileInto(token, user, persistSession)
        }
      }
    }),
    [user, token, loading, login, register, logout, updateUser, persistSession]
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
