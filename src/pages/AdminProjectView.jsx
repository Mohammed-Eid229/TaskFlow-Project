import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import Layout from "../layout/Layout"
import { getProjectById } from "../services/projectService"
import { getProjectStats, getProjectDashboard } from "../services/projectService"
import { useToast } from "../context/ToastContext"
import { getApiErrorParts } from "../utils/apiError"
import { RiArrowLeftLine, RiFolderLine, RiUserLine, RiListCheck, RiTeamLine } from "react-icons/ri"

export default function AdminProjectView() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      
      // جيب بيانات المشروع الأساسية
      const res = await getProjectById(id)
      const projectData = res?.data?.data ?? res?.data ?? {}
      
      // جيب إحصائيات المشروع (عدد المهام)
      const statsRes = await getProjectStats(id)
      const stats = statsRes?.data?.data ?? statsRes?.data ?? {}
      
      // جيب لوحة تحكم المشروع (عشان الأعضاء)
      const dashboardRes = await getProjectDashboard(id)
      const dashboardData = dashboardRes?.data?.data ?? dashboardRes?.data ?? {}
      const membersList = dashboardData.members ?? []
      
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
                        projectData.createdBy?.name ||
                        projectData.ownerName ||
                        "No PM assigned"
      
      const ownerEmail = projectManager?.email || ""
      
      setProject({
        ...projectData,
        taskCount: stats.totalTasks ?? stats.tasksCount ?? 0,
        membersCount: membersList.length,
        ownerName: ownerName,
        ownerEmail: ownerEmail,
        projectId: projectData.id || id
      })
    } catch (error) {
      console.error("Error fetching project:", error)
      showToast(getApiErrorParts(error, "Failed to load project").title, "danger")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout>
        <p className="page-lede">Project not found.</p>
        <Link to="/admin/projects" className="breadcrumb-link">
          <RiArrowLeftLine aria-hidden />
          Back to projects
        </Link>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/admin/projects" className="breadcrumb-link">
        <RiArrowLeftLine aria-hidden />
        Back to projects
      </Link>

      <div className="admin-project-view">
        <h1 className="dashboard-title">{project.name || project.title}</h1>
        <p className="page-lede">{project.description || "No description"}</p>

        <div className="admin-project-facts card">
          <div className="admin-project-fact">
            <RiUserLine aria-hidden />
            <div>
              <span className="admin-project-fact-label">Owner (PM)</span>
              <span className="admin-project-fact-value">
                <strong>{project.ownerName}</strong>
                {project.ownerEmail && <div style={{ fontSize: "12px", color: "#666" }}>{project.ownerEmail}</div>}
              </span>
            </div>
          </div>
          
          <div className="admin-project-fact">
            <RiTeamLine aria-hidden />
            <div>
              <span className="admin-project-fact-label">Members</span>
              <span className="admin-project-fact-value">{project.membersCount} members</span>
            </div>
          </div>
          
          <div className="admin-project-fact">
            <RiListCheck aria-hidden />
            <div>
              <span className="admin-project-fact-label">Task count</span>
              <span className="admin-project-fact-value">{project.taskCount} tasks</span>
            </div>
          </div>
          
          <div className="admin-project-fact">
            <RiFolderLine aria-hidden />
            <div>
              <span className="admin-project-fact-label">Project ID</span>
              <span className="admin-project-fact-value">{project.projectId || project.id}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}