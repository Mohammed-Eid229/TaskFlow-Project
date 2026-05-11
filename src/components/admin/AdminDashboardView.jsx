import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  RiTeamLine,
  RiFolderLine,
  RiCheckboxLine,
  RiPulseLine,
} from "react-icons/ri"

export default function AdminDashboardView() {
  const recent = initialActivityLog.slice(0, 5)

  const cards = [
    {
      key: "users",
      label: "Total Users",
      value: stats.users,
      icon: RiTeamLine,
      tone: "purple",
    },
    {
      key: "projects",
      label: "Total Projects",
      value: stats.projects,
      icon: RiFolderLine,
      tone: "blue",
    },
    {
      key: "tasks",
      label: "Total Tasks",
      value: stats.tasks,
      icon: RiCheckboxLine,
      tone: "green",
    },
    {
      key: "active",
      label: "Active Users",
      value: stats.activeUsers,
      icon: RiPulseLine,
      tone: "orange",
    },
  ]

  if (loading) {
    return (
      <div className="dashboard-container admin-dashboard">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <div className="stats admin-stat-cards">
        {cards.map((c) => (
          <div
            key={c.key}
            className={`card admin-stat-card admin-stat-card--${c.tone}`}
          >
            <span className="admin-stat-icon" aria-hidden>
              <c.icon />
            </span>
            <div className="admin-stat-text">
              <h2>{c.value}</h2>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid admin-dashboard-grid">
        <div className="card large admin-chart-card">
          <h3>Activity trend</h3>
          <p className="admin-chart-sub">
            Users and tasks activity — last 7 days
          </p>
          {trendData.length > 0 && trendData.some(t => t.users > 0 || t.tasks > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Users"
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#14b8a6"
                  fillOpacity={1}
                  fill="url(#colorTasks)"
                  name="Tasks"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center py-4">No trend data available</p>
          )}
        </div>

        <div className="card admin-recent-card">
          <h3>Recent activity</h3>
          {recentActivities.length > 0 ? (
            <ul className="admin-recent-list">
              {recentActivities.map((row, idx) => (
                <li key={row.id || idx} className="admin-recent-item">
                  <span className="admin-recent-main">
                    {row.description || row.message || "Activity"}
                  </span>
                  <time className="admin-recent-time" dateTime={row.date}>
                    {formatActivityTime(row.date)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}