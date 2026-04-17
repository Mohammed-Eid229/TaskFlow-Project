import Layout from "../layout/Layout"
import { useNotifications } from "../context/NotificationContext"

export default function Notifications() {

  const { notifications, markAsRead } = useNotifications()

  return (

    <Layout>

      <h1 className="dashboard-title">Notifications</h1>
      <p className="page-lede">Updates on tasks and projects</p>

      <div className="notifications-list">

        {notifications.map(n => (

          <div
            key={n.id}
            className={`notification-card ${n.read ? "read" : "unread"}`}
          >

            <div className="notification-text">

              <p>{n.message}</p>

              <span className="notification-time">
                {n.time}
              </span>

            </div>

            {!n.read && (

              <button
                className="mark-read-btn"
                onClick={() => markAsRead(n.id)}
              >
                Mark as read
              </button>

            )}

          </div>

        ))}

      </div>

    </Layout>

  )

}