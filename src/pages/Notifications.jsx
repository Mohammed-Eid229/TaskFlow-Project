/* eslint-disable no-unused-vars */
import Layout from "../layout/Layout"
import { useNotifications } from "../context/NotificationContext"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"
import { formatRelativeTime } from "../utils/dateUtils"
import { 
  RiCheckDoubleLine, 
  RiNotificationLine, 
  RiTaskLine, 
  RiChat1Line, 
  RiUserAddLine, 
  RiDeleteBinLine,
  RiRefreshLine
} from "react-icons/ri"

function formatTime(dateString) {
  return formatRelativeTime(dateString)
}

function getNotificationIcon(type, message) {
  const msg = message?.toLowerCase() || ""
  if (type === "task" || msg.includes("task")) {
    return <RiTaskLine className="text-primary" />
  }
  if (type === "comment" || msg.includes("comment")) {
    return <RiChat1Line className="text-success" />
  }
  if (type === "attachment" || msg.includes("attachment")) {
    return <RiUserAddLine className="text-info" />
  }
  if (msg.includes("assign") || msg.includes("assigned")) {
    return <RiUserAddLine className="text-warning" />
  }
  if (msg.includes("delete") || msg.includes("remove")) {
    return <RiDeleteBinLine className="text-danger" />
  }
  return <RiNotificationLine className="text-secondary" />
}

export default function Notifications() {
  const { user } = useAuth()
  const { notifications, loading, unreadCount, userRole, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  
  const getRoleTitle = () => {
    if (userRole === "admin") return "All System Activities"
    if (userRole === "pm") return "Updates on Your Projects"
    return "Updates on Your Assigned Tasks"
  }

  const getEmptyMessage = () => {
    if (userRole === "admin") return "No system activities yet."
    if (userRole === "pm") return "No updates on your projects yet."
    return "When you get assigned to tasks, notifications will appear here."
  }

  return (
    <Layout>
      <div className="notifications-page">
        <div className="notifications-header">
          <div>
            <h1 className="dashboard-title">Notifications</h1>
            <p className="page-lede">
              {getRoleTitle()}
              {unreadCount > 0 && (
                <span className="badge bg-primary ms-2">{unreadCount} unread</span>
              )}
            </p>
          </div>
          <div className="d-flex gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={refreshNotifications}
                title="Refresh notifications"
              >
                <RiRefreshLine /> Refresh
              </button>
            )}
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={markAllAsRead}
              >
                <RiCheckDoubleLine /> Mark all as read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-5">
            <RiNotificationLine size={48} className="text-muted mb-3" />
            <p className="text-muted">{getEmptyMessage()}</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-card ${n.read ? "read" : "unread"}`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(n.type, n.message)}
                </div>
                <div className="notification-content">
                  <div className="notification-text">
                    <p className={!n.read ? "fw-bold" : ""}>{n.message}</p>
                    <span className="notification-time">{formatTime(n.createdAt)}</span>
                  </div>
                  {!n.read && (
                    <span className="unread-dot"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}