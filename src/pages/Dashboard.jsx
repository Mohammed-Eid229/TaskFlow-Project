/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import Layout from "../layout/Layout"
import { useAuth } from "../context/AuthContext"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "../context/ToastContext"
import { isAdmin } from "../utils/roles"
import AdminDashboardView from "../components/admin/AdminDashboardView"
import { getMyProfile } from "../services/userService"
import { getMyTasks } from "../services/taskService"
import { getProjects, getProjectDashboard } from "../services/projectService"
import { getApiErrorParts } from "../utils/apiError"
import { formatRelativeTime } from "../utils/dateUtils"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import { RiUserLine, RiTaskLine, RiCheckboxCircleLine, RiTimerLine, RiTimeLine } from "react-icons/ri"

function formatActivityTime(dateString) {
  return formatRelativeTime(dateString)
}

export default function Dashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const admin = isAdmin(user)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ tasks: 0, completed: 0, projects: 0, pending: 0 })
  const [progressData, setProgressData] = useState([
    { name: "To Do", value: 0 },
    { name: "In Progress", value: 0 },
    { name: "Done", value: 0 },
  ])
  const [recentActivities, setRecentActivities] = useState([])
  const [progress, setProgress] = useState({ planned: 0, actual: 0 })
  const [userName, setUserName] = useState("")
  
  const userRole = user?.role || user?.displayRole || ""
  const isPM = userRole === "Project Manager" || userRole === "projectmanager"
  const isTeamMember = !admin && !isPM

  useEffect(() => {
    if (admin) return
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        
        try {
          const profileRes = await getMyProfile()
          const profileData = profileRes?.data?.data ?? profileRes?.data ?? {}
          if (profileData.fullName) setUserName(profileData.fullName)
          else if (profileData.name) setUserName(profileData.name)
        } catch (e) {}

        const projectsRes = await getProjects()
        let allProjects = []
        if (projectsRes?.data?.data) {
          allProjects = projectsRes.data.data
        } else if (Array.isArray(projectsRes?.data)) {
          allProjects = projectsRes.data
        }
        
        console.log("All projects:", allProjects.length)
        
        let allTasks = []
        
        if (isPM) {
          // للـ Manager: جيب المهام من كل مشروع
          for (const project of allProjects) {
            try {
              const dashboardRes = await getProjectDashboard(project.id)
              const tasks = dashboardRes?.data?.data?.tasks ?? []
              console.log(`Tasks for project ${project.id}:`, tasks.length)
              allTasks = [...allTasks, ...tasks]
            } catch (e) {
              console.error(`Error getting tasks for project ${project.id}:`, e)
            }
          }
        } else {
          // للـ Member: جيب المهام اللي معين فيها
          const tasksRes = await getMyTasks()
          if (tasksRes?.data?.data) {
            allTasks = tasksRes.data.data
          } else if (Array.isArray(tasksRes?.data)) {
            allTasks = tasksRes.data
          }
          // فلتر المهام اللي معموله assign ليه
          allTasks = allTasks.filter(t => 
            t.assignedTo === user?.id || 
            t.assignedUserId === user?.id ||
            t.assignedUserName === user?.email ||
            t.assignedTo === user?.email
          )
        }
        
        console.log("All tasks for user:", allTasks.length)
        
        const totalTasks = allTasks.length
        const completedTasks = allTasks.filter(t => t.status === "done" || t.status === "completed").length
        const inProgressTasks = allTasks.filter(t => t.status === "progress" || t.status === "in_progress" || t.status === "inprogress").length
        const todoTasks = allTasks.filter(t => t.status === "todo" || !t.status).length
        const overdueTasks = allTasks.filter(t => {
          if (t.status === "done" || t.status === "completed") return false
          if (!t.dueDate) return false
          return new Date(t.dueDate) < new Date()
        }).length

        setStats({
          tasks: totalTasks,
          completed: completedTasks,
          projects: allProjects.length,
          pending: overdueTasks
        })

        // مهم: الشرط هنا
        if (isTeamMember) {
          // للـ Team Member: بس In Progress و Done
          setProgressData([
            { name: "In Progress", value: inProgressTasks },
            { name: "Done", value: completedTasks },
          ])
        } else {
          // للـ Manager: To Do, In Progress, Done
          setProgressData([
            { name: "To Do", value: todoTasks },
            { name: "In Progress", value: inProgressTasks },
            { name: "Done", value: completedTasks },
          ])
        }

        const actual = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        const planned = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 0
        setProgress({
          planned: Math.max(0, Math.min(100, planned)),
          actual: Math.max(0, Math.min(100, actual)),
        })

        const recent = allTasks
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 5)
          .map(task => ({
            id: task.id,
            message: `Task "${task.title}" is ${task.status === "done" ? "completed" : task.status === "progress" ? "in progress" : "pending"}`,
            time: task.updatedAt || task.createdAt
          }))
        setRecentActivities(recent)

      } catch (error) {
        console.error("Dashboard loading error:", error)
        showToast(getApiErrorParts(error, "Failed to load dashboard").title, "danger")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [admin, showToast, user?.id, user?.email, isPM, isTeamMember])

  const pieData = useMemo(() => [
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: Math.max(stats.tasks - stats.completed - stats.pending, 0) },
    { name: "Overdue", value: stats.pending },
  ], [stats])

  const COLORS = ["#10b981", "#6366f1", "#f59e0b"]

  if (admin) {
    return <Layout><AdminDashboardView /></Layout>
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome back, {userName || user?.fullName || user?.name || "User"}! </h1>
            <p className="page-lede">Here's what's happening with your tasks today.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat-card purple">
                <RiTaskLine size={28} />
                <h2>{stats.tasks}</h2>
                <p>Total Tasks</p>
              </div>
              <div className="stat-card blue">
                <RiCheckboxCircleLine size={28} />
                <h2>{stats.completed}</h2>
                <p>Completed</p>
              </div>
              <div className="stat-card green">
                <RiUserLine size={28} />
                <h2>{stats.projects}</h2>
                <p>Projects</p>
              </div>
              <div className="stat-card orange">
                <RiTimerLine size={28} />
                <h2>{stats.pending}</h2>
                <p>Overdue</p>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card large">
                <h3>Tasks Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name"
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend">
                  <div><span className="green-dot" style={{ background: "#10b981" }}></span> Completed</div>
                  <div><span className="blue-dot" style={{ background: "#6366f1" }}></span> In Progress</div>
                  <div><span className="orange-dot" style={{ background: "#f59e0b" }}></span> Overdue</div>
                </div>
              </div>

              <div className="card">
                <h3>Tasks Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3>Project Progress</h3>
                <div className="progress-item">
                  <span className="progress-title">Planned</span>
                  <div className="progress-bar">
                    <div className="progress-fill planned" style={{ width: `${progress.planned}%` }}>
                      {progress.planned}%
                    </div>
                  </div>
                </div>
                <div className="progress-item">
                  <span className="progress-title">Actual</span>
                  <div className="progress-bar">
                    <div className="progress-fill actual" style={{ width: `${progress.actual}%` }}>
                      {progress.actual}%
                    </div>
                  </div>
                </div>
                <div className="legend">
                  <div><span className="planned-dot"></span> Planned</div>
                  <div><span className="actual-dot"></span> Actual</div>
                </div>
              </div>

              <div className="card">
                <h3>Recent Activity</h3>
                {recentActivities.length > 0 ? (
                  <div className="activity-list">
                    {recentActivities.map((item) => (
                      <div key={item.id} className="activity-item">
                        <div className="activity-icon">
                          <RiTimeLine size={16} />
                        </div>
                        <div className="activity-content">
                          <p className="activity-message">{item.message}</p>
                          {item.time && (
                            <small className="activity-time">{formatActivityTime(item.time)}</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No recent activity yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}