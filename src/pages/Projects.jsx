import Layout from "../layout/Layout"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import CreateProjectModal from "../components/project/CreateProjectModal"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { canCreateProjectsAndTasks, isAdmin } from "../utils/roles"
import { RiFolderLine, RiTeamLine, RiArrowRightLine, RiCheckboxLine } from "react-icons/ri"
import AdminProjects from "./AdminProjects"
import { createProject, getProjects, getProjectDashboard } from "../services/projectService"
import { getApiErrorParts } from "../utils/apiError"
import api from "../services/api"

export default function Projects() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const userRole = user?.role || user?.displayRole || ""
  const isPM = userRole === "Project Manager" || userRole === "projectmanager"
  const isTeamMember = !isAdmin(user) && !isPM

  const normalizeProject = (item) => {
    if (!item || typeof item !== "object") return null
    return {
      id: item.id ?? item.projectId ?? item._id ?? Date.now(),
      title: item.name ?? item.title ?? item.projectName ?? "Untitled project",
      description: item.description ?? item.details ?? "",
      members: 0,
      tasksOpen: 0,
      myTasksCount: 0,
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await getProjects()
        console.log("Projects API response:", res)
        
        const rawList = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data?.projects) ? res.data.projects : []
        
        if (!mounted) return

        const normalized = rawList.map(normalizeProject).filter(Boolean)
        
        // جيب بيانات كل مشروع من الـ dashboard مع التاسكات
        const projectsWithData = await Promise.all(
          normalized.map(async (p) => {
            try {
              // جيب التاسكات الخاصة بالمشروع من API منفصلة
              const tasksRes = await api.get(`/task/GetByProjectId/${p.id}`)
              let tasksList = []
              if (Array.isArray(tasksRes?.data)) {
                tasksList = tasksRes.data
              } else if (tasksRes?.data?.data) {
                tasksList = tasksRes.data.data
              } else if (Array.isArray(tasksRes)) {
                tasksList = tasksRes
              }
              
              const dashboardRes = await getProjectDashboard(p.id)
              const dashboardData = dashboardRes?.data?.data ?? dashboardRes?.data ?? {}
              const membersList = dashboardData.members ?? []
              const stats = dashboardData.stats ?? {}
              const totalTasks = stats.totalTasks ?? tasksList.length
              
              // عدد المهام اللي معموله assign للميمبر الحالي في هذا المشروع
              let myTasksInProject = 0
              if (isTeamMember) {
                console.log(`Project ${p.id} - Tasks:`, tasksList)
                console.log(`User email: ${user?.email}`)
                myTasksInProject = tasksList.filter(t => 
                  t.assignedUserName === user?.email
                ).length
              } else if (isPM) {
                myTasksInProject = tasksList.length
              }
              
              console.log(`Project ${p.id} - Total tasks: ${tasksList.length}, My tasks: ${myTasksInProject}`)
              
              return {
                ...p,
                members: membersList.length,
                tasksOpen: totalTasks,
                myTasksCount: myTasksInProject,
              }
            } catch (err) {
              console.error(`Failed to get data for project ${p.id}:`, err)
              return {
                ...p,
                members: 0,
                tasksOpen: 0,
                myTasksCount: 0,
              }
            }
          })
        )
        
        if (mounted) {
          setProjects(projectsWithData)
        }
      } catch (err) {
        console.error("Load projects error:", err)
        showToast(getApiErrorParts(err, "Failed to load projects").title, "danger")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [showToast, user?.email, isPM, isTeamMember])

  if (isAdmin(user)) return <AdminProjects />

  const canCreate = canCreateProjectsAndTasks(user)

  const handleCreateProject = async (title, description) => {
    try {
      const res = await createProject({ title, name: title, description })
      console.log("Create project response:", res)
      const rawProject = res?.data?.data ?? res?.data ?? { name: title, description }
      const created = normalizeProject(rawProject)
      
      try {
        const dashboardRes = await getProjectDashboard(created.id)
        const members = dashboardRes?.data?.data?.members ?? []
        created.members = members.length
      } catch {
        created.members = 1
      }
      
      setProjects((prev) => [...prev, created])
      showToast("Project created successfully", "success")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to create project").title, "danger")
    }
  }

  return (
    <Layout>
      <div className="projects-page">
        <div className="project-header">
          <div>
            <h1 className="dashboard-title">Projects</h1>
            <p className="page-lede">Open a project to view the board and tasks</p>
          </div>
          {canCreate ? (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              + Create project
            </button>
          ) : null}
        </div>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 projects-grid">
          {loading ? (
            <div className="col-12">
              <p className="page-lede">Loading projects...</p>
            </div>
          ) : null}
          
          {!loading && projects.length === 0 ? (
            <div className="col-12">
              <p className="page-lede">No projects yet. {canCreate ? "Click 'Create project' to get started." : ""}</p>
            </div>
          ) : null}
          
          {projects.map((project) => (
            <div key={project.id} className="col">
              <Link to={`/projects/${project.id}`} state={{ project }} className="project-tile text-decoration-none">
                <article className="card project-card-elevated h-100">
                  <div className="project-card-top">
                    <span className="project-card-icon" aria-hidden><RiFolderLine /></span>
                    <RiArrowRightLine className="project-card-arrow" aria-hidden />
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description || "No description"}</p>
                  <div className="project-card-meta">
                    <span><RiTeamLine aria-hidden /> {project.members || 0} members</span>
                    <span><i className="bi bi-clipboard"></i> {project.tasksOpen || 0} tasks</span>
                    {isTeamMember && (
                      <span><RiCheckboxLine /> {project.myTasksCount || 0} assigned to you</span>
                    )}
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateProject}
        />
      </div>
    </Layout>
  )
}