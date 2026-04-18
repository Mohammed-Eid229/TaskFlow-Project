import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthAlert from "../components/AuthAlert"

const ROLE_API = {
  admin: "Admin",
  manager: "ProjectManager",
  member: "TeamMember",
}

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("member")
  const [error, setError] = useState(null)
  const [info, setInfo] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo("")
    if (!fullName.trim() || !email.trim() || !password) {
      setError({ title: "Please fill in all fields." })
      return
    }
    if (password.length < 6) {
      setError({ title: "Password must be at least 6 characters." })
      return
    }

    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      role: ROLE_API[role],
    })

    if (result.ok) {
      if (result.needsLogin) {
        setInfo("Account created. You can sign in once the server approves your role (if required).")
        setTimeout(() => navigate("/login"), 2000)
      } else {
        if (result.pendingPmApproval) {
          setInfo("PM request submitted. You can continue now as User until Admin approves it.")
          setTimeout(() => navigate("/dashboard", { replace: true }), 1200)
          return
        }
        navigate("/dashboard", { replace: true })
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--elevated auth-card--wide">
        <div className="auth-brand">
          <span className="auth-brand-mark">TF</span>
          <div>
            <h1 className="auth-title">Join TaskFlow</h1>
            <p className="auth-subtitle">Create your account</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AuthAlert message={error} />
          {info ? (
            <AuthAlert message={{ title: info }} variant="success" />
          ) : null}

          <label className="auth-label" htmlFor="reg-name">
            Full name
          </label>
          <input
            id="reg-name"
            name="fullName"
            className="input"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />

          <label className="auth-label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="auth-label" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            className="input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label className="auth-label" htmlFor="reg-role">
            Role
          </label>
          <select
            id="reg-role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input input-select"
          >
            <option value="admin">Admin</option>
            <option value="manager">Project Manager</option>
            <option value="member">Team Member</option>
          </select>
          <p className="auth-hint">
            Your backend may restrict which roles can self-register (e.g. PM pending approval).
          </p>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
