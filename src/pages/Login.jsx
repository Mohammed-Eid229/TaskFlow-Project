import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthAlert from "../components/AuthAlert"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || "/dashboard"

 const handleSubmit = async (e) => {
  e.preventDefault()
  setError(null)
  if (!email.trim() || !password) {
    setError({ title: "Please enter email and password." })
    return
  }
  const result = await login({ email: email.trim(), password })
  console.log("result:", result)  // ← هنا
  if (result.ok) {
    navigate(from, { replace: true })
  } else {
    setError(result.error)
  }
}

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--elevated">
        <div className="auth-brand">
          <span className="auth-brand-mark">TF</span>
          <div>
            <h1 className="auth-title">TaskFlow</h1>
            <p className="auth-subtitle">Sign in to continue</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AuthAlert message={error} />

          <label className="auth-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="auth-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
