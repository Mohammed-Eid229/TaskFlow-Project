import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthAlert from "../components/AuthAlert"

const ROLE_API = {
  admin: "Admin",
  manager: "Project Manager",
  member: "Team Member",
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
      if (role === "manager") {
        // لو PM، ينتظر موافقة الـ Admin
        setInfo("Your request to become a Project Manager has been submitted. You can login now as a Team Member until admin approves your request.")
        setTimeout(() => navigate("/login"), 2000)
      } else {
        // لو Team Member، يدخل علطول
        setInfo("Account created successfully! Please login.")
        setTimeout(() => navigate("/login"), 1500)
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
            <option value="manager">Project Manager (requires admin approval)</option>
            <option value="member">Team Member (immediate access)</option>
          </select>
          <p className="auth-hint">
            {role === "manager" 
              ? "You will be able to login as Team Member first. Admin must approve your PM request." 
              : "You will get immediate access as a Team Member."}
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