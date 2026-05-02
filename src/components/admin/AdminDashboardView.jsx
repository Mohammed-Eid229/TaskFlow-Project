import { useEffect, useState } from "react"
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
import { getAllUsersForAdmin, getActivityLog, getActivityTrend } from "../../services/userService"
import { getAllProjectsForAdmin } from "../../services/userService"
import { getTasks } from "../../services/taskService"
import { useToast } from "../../context/ToastContext"
import { getApiErrorParts } from "../../utils/apiError"

function formatActivityTime(dateString) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${diffDays} days ago`
}

export default function AdminDashboardView() {
  const { showToast } = useToast()
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    tasks: 0,
    activeUsers: 0,
  })
  const [trendData, setTrendData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // جيب كل المستخدمين
      const usersRes = await getAllUsersForAdmin()
      const usersList = usersRes?.data?.data ?? usersRes?.data ?? []
      
      // جيب كل المشاريع
      const projectsRes = await getAllProjectsForAdmin()
      const projectsList = projectsRes?.data?.data ?? projectsRes?.data ?? []
      
      // جيب كل المهام (من كل مشروع)
      let totalTasks = 0
      for (const project of projectsList) {
        try {
          const tasksRes = await getTasks(project.id)
          const tasks = tasksRes?.data?.data ?? tasksRes?.data ?? []
          totalTasks += tasks.length
        } catch (e) {}
      }
      
      // حساب الإحصائيات
      const activeUsers = usersList.filter(u => u.isActive !== false).length
      
      setStats({
        users: usersList.length,
        projects: projectsList.length,
        tasks: totalTasks,
        activeUsers: activeUsers,
      })
      
      // جيب النشاطات الأخيرة
      const activitiesRes = await getActivityLog()
      const activities = activitiesRes?.data?.data ?? activitiesRes?.data ?? []
      setRecentActivities(activities.slice(0, 5))
      
      // جيب بيانات الـ trend من الـ API المخصصة
      const trendRes = await getActivityTrend()
      console.log("Activity Trend API response:", trendRes)
      
      let trend = []
      
      // التحقق من شكل الـ response
      if (trendRes?.data?.data) {
        // لو الـ response جاية في data.data
        const trendApi = trendRes.data.data
        console.log("Trend data from API:", trendApi)
        
        // لو كانت array مباشرة
        if (Array.isArray(trendApi)) {
          trend = trendApi.map(item => ({
            label: item.date || item.label || item.day,
            users: item.users || item.userCount || 0,
            tasks: item.tasks || item.taskCount || 0,
          }))
        }
        // لو كانت object فيها labels و users و tasks
        else if (trendApi.labels && Array.isArray(trendApi.labels)) {
          trend = trendApi.labels.map((label, index) => ({
            label: label,
            users: trendApi.users?.[index] || 0,
            tasks: trendApi.tasks?.[index] || 0,
          }))
        }
      } 
      // لو الـ response جاية في data مباشرة
      else if (trendRes?.data && Array.isArray(trendRes.data)) {
        trend = trendRes.data.map(item => ({
          label: item.date || item.label || item.day,
          users: item.users || item.userCount || 0,
          tasks: item.tasks || item.taskCount || 0,
        }))
      }
      // لو الـ response جاية في شكل object مختلف
      else if (trendRes?.data?.labels) {
        trend = trendRes.data.labels.map((label, index) => ({
          label: label,
          users: trendRes.data.users?.[index] || 0,
          tasks: trendRes.data.tasks?.[index] || 0,
        }))
      }
      
      console.log("Formatted trend data:", trend)
      setTrendData(trend)
      
    } catch (error) {
      console.error("Dashboard error:", error)
      showToast(getApiErrorParts(error, "Failed to load dashboard").title, "danger")
      
      // Fallback: استخدم الأيام الأخيرة مع بيانات تجريبية
      const last7Days = getLast7Days()
      setTrendData(last7Days.map(day => ({
        label: day.label,
        users: 0,
        tasks: 0,
      })))
    } finally {
      setLoading(false)
    }
  }

  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      })
    }
    return days
  }

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