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
          const { token: t, user: u } = buildMockSession({
            email: trimmed,
            fullName: trimmed.split("@")[0] || "User",
            role: inferMockRoleFromEmail(trimmed),
          })
          persistSession(t, u)
          return { ok: true }
        }

        const res = await loginRequest({ email, password })
        const { token: t, user: u } = normalizeAuthPayload(res.data, {
          email,
        })
        if (!t) {
          throw new Error(
            "Server did not return a token. Check the login API response shape."
          )
        }
        persistSession(t, u)
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
          const { token: t, user: u } = buildMockSession({
            email: email.trim(),
            fullName: fullName.trim(),
            role,
          })
          persistSession(t, u)
          return { ok: true, needsLogin: false }
        }

        const res = await registerRequest({
          fullName,
          email,
          password,
          role,
        })
        const { token: t, user: u } = normalizeAuthPayload(res.data, {
          email,
          fullName,
          role,
        })
        if (t && u) {
          persistSession(t, u)
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
