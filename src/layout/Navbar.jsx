import { useNavigate } from "react-router-dom"
import { useNotifications } from "../context/NotificationContext"
import { useAuth } from "../context/AuthContext"
import { IoNotificationsOutline } from "react-icons/io5"
import { LuUser } from "react-icons/lu"
import { RiLogoutBoxLine } from "react-icons/ri"
import { HiOutlineMenu } from "react-icons/hi"

export default function Navbar({ toggleSidebar }) {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (

    <div className="navbar">
      <span className="menu-btn" onClick={toggleSidebar}>
        <HiOutlineMenu />
      </span>

      {user?.fullName || user?.email ? (
        <span className="navbar-user">
          {user.fullName || user.email}
        </span>
      ) : null}

      <div className="navbar-right">

        <span
          className="navbar-item"
          onClick={() => navigate("/notifications")}
        >
          <IoNotificationsOutline /> Notifications
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount}
            </span>
          )}
        </span>

        <span
          className="navbar-item"
          onClick={() => navigate("/profile")}
        >
          <LuUser /> Profile
        </span>

        <span className="navbar-item" onClick={handleLogout}>
          <RiLogoutBoxLine /> Logout
        </span>

      </div>

    </div>

  )

}