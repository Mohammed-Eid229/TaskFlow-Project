import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { isAdmin } from "../utils/roles"

const navClass = ({ isActive }) =>
  `sidebar-link${isActive ? " sidebar-link--active" : ""}`

export default function Sidebar({ sidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const admin = isAdmin(user)

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <span className="sidebar-mark" aria-hidden>
          TF
        </span>
        <h2 className="sidebar-title logo">TaskFlow</h2>
      </div>
      <nav className="sidebar-nav-grow">
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/dashboard" className={navClass} end>
              Dashboard
            </NavLink>
          </li>
          {admin ? (
            <>
              <li>
                <NavLink to="/users" className={navClass}>
                  Users
                </NavLink>
              </li>
              <li>
                <NavLink to="/projects" className={navClass}>
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink to="/activity" className={navClass}>
                  Activity
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/projects" className={navClass}>
                Projects
              </NavLink>
            </li>
          )}
          <li>
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
    </aside>
  )
}