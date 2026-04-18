import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { isAdmin } from "../utils/roles"
import {
  RiDashboardLine,
  RiFolderLine,
  RiUser3Line,
  RiUserFollowLine,
  RiPulseLine,
  RiUserSettingsLine,
  RiLogoutCircleRLine,
} from "react-icons/ri"

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
              <RiDashboardLine aria-hidden />
              <span className="sidebar-link__label">Dashboard</span>
            </NavLink>
          </li>
          {admin ? (
            <>
              <li>
                <NavLink to="/users" className={navClass}>
                  <RiUser3Line aria-hidden />
                  <span className="sidebar-link__label">Users</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/pending-users" className={navClass}>
                  <RiUserFollowLine aria-hidden />
                  <span className="sidebar-link__label">Pending Users</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/projects" className={navClass}>
                  <RiFolderLine aria-hidden />
                  <span className="sidebar-link__label">Projects</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/activity" className={navClass}>
                  <RiPulseLine aria-hidden />
                  <span className="sidebar-link__label">Activity</span>
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/projects" className={navClass}>
                <RiFolderLine aria-hidden />
                <span className="sidebar-link__label">Projects</span>
              </NavLink>
            </li>
          )}
          <li>
            <NavLink to="/profile" className={navClass}>
              <RiUserSettingsLine aria-hidden />
              <span className="sidebar-link__label">Profile</span>
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            <RiLogoutCircleRLine aria-hidden />
            <span className="sidebar-link__label">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}