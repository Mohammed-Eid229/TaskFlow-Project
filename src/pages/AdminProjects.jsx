import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Layout from "../layout/Layout"
import ConfirmDialog from "../components/admin/ConfirmDialog"
import { useToast } from "../context/ToastContext"
import { getAllProjectsForAdmin, deleteProjectByAdmin } from "../services/userService"
import { getProjectDashboard } from "../services/projectService"
import { getApiErrorParts } from "../utils/apiError"
import { RiFolderLine, RiEyeLine, RiDeleteBinLine, RiTeamLine, RiUserLine } from "react-icons/ri"

export default function AdminProjects() {
  const { showToast } = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await getAllProjectsForAdmin()
      let projectsList = res?.data?.data ?? res?.data ?? []
      
      console.log("Projects list:", projectsList)
      
      const projectsWithDetails = await Promise.all(
        projectsList.map(async (p) => {
          try {
            // استخدم getProjectDashboard بدل getProjectMembers
            const dashboardRes = await getProjectDashboard(p.id)
            const dashboardData = dashboardRes?.data?.data ?? dashboardRes?.data ?? {}
            
            const membersList = dashboardData.members ?? []
            const stats = dashboardData.stats ?? {}
            
            console.log(`Project ${p.id} - Members count:`, membersList.length)
            console.log(`Project ${p.id} - Stats:`, stats)
            
            // جيب الـ Project Manager من قائمة الأعضاء
            const projectManager = membersList.find(m => {
              const role = String(m.role || "").toLowerCase().replace(/[\s_]/g, "")
              return role === "projectmanager" || 
                     role === "project manager" || 
                     role === "pm" ||
                     m.role === "Project Manager"
            })
            
            const ownerName = projectManager?.userName || 
                              projectManager?.name || 
                              projectManager?.fullName || 
                              projectManager?.email ||
                              (membersList[0]?.userName || membersList[0]?.name || "No PM assigned")
            
            const ownerEmail = projectManager?.email || membersList[0]?.email || ""
            
            return {
              ...p,
              taskCount: stats.totalTasks ?? stats.tasksCount ?? 0,
              membersCount: membersList.length,
              ownerName: ownerName,
              ownerEmail: ownerEmail
            }
          } catch (err) {
            console.error(`Failed to get details for project ${p.id}:`, err)
            return {
              ...p,
              taskCount: 0,
              membersCount: 0,
              ownerName: "Unknown",
              ownerEmail: ""
            }
          }
        })
      )
      
      setProjects(projectsWithDetails)
    } catch (error) {
      console.error("Error fetching projects:", error)
      showToast(getApiErrorParts(error, "Failed to load projects").title, "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (pendingDelete == null) return
    try {
      await deleteProjectByAdmin(pendingDelete)
      setProjects((prev) => prev.filter((p) => p.id !== pendingDelete))
      showToast("Project deleted successfully", "success")
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to delete project").title, "danger")
    }
    setPendingDelete(null)
  }

  const title = projects.find((p) => p.id === pendingDelete)?.name || projects.find((p) => p.id === pendingDelete)?.title

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">Loading projects...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="admin-page">
        <h1 className="dashboard-title">Projects</h1>
        <p className="page-lede">All projects (read-only for admins).</p>

        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Owner (PM)</th>
                  <th>Members</th>
                  <th>Tasks</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="admin-project-title">
                        <RiFolderLine aria-hidden />
                        {p.name || p.title}
                      </span>
                      <span className="admin-project-desc">{p.description || "No description"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <RiUserLine /> 
                        <div>
                          <strong>{p.ownerName}</strong>
                          {p.ownerEmail && <div style={{ fontSize: "12px", color: "#666" }}>{p.ownerEmail}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <RiTeamLine /> {p.membersCount} members
                      </span>
                    </td>
                    <td>{p.taskCount || 0}</td>
                    <td className="admin-table-actions admin-table-actions--row">
                      <Link
                        to={`/admin/projects/${p.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        <RiEyeLine aria-hidden /> View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setPendingDelete(p.id)}
                      >
                        <RiDeleteBinLine aria-hidden /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.length === 0 ? <p className="admin-empty">No projects found.</p> : null}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        title="Delete project?"
        danger
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      >
        {title ? (
          <p>Remove <strong>{title}</strong>? This action cannot be undone.</p>
        ) : null}
      </ConfirmDialog>
    </Layout>
  )
}