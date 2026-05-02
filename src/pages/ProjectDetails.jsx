import Layout from "../layout/Layout"
import Column from "../components/task/Column"
import { DragDropContext } from "react-beautiful-dnd"
import { useEffect, useMemo, useState } from "react"
import AddTaskModal from "../components/task/AddTaskModal"
import { Link, Navigate, useParams, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { canCreateProjectsAndTasks, isAdmin } from "../utils/roles"
import { RiArrowLeftLine, RiDragMoveLine, RiTeamLine, RiDeleteBinLine } from "react-icons/ri"
import { createTask, deleteTask, updateTask } from "../services/taskService"
import { deleteProject, getProjectWorkloads, getProjectProgress, 
  getProjectDashboard, removeProjectMember, addMemberByEmail } from "../services/projectService"
import { getApiErrorParts } from "../utils/apiError"



function normalizeTaskStatus(status) {
  const key = String(status || "todo").toLowerCase().replace(/[_\s]/g, "")
  if (["inprogress", "progress", "doing"].includes(key)) return "progress"
  if (["done", "completed", "closed"].includes(key)) return "done"
  return "todo"
}

function normalizeTask(item, project) {
  return {
    id: item.id ?? item.taskId ?? `t-${Date.now()}`,
    title: item.title ?? item.name ?? "Untitled task",
    description: item.description ?? "",
    status: normalizeTaskStatus(item.status),
    priority: String(item.priority ?? "medium").toLowerCase(),
    assignedTo: item.assignedUserName ?? item.assignedTo ?? item.assigneeName ?? "Unassigned",
    dueDate: item.dueDate ?? "",
    projectId: String(project.id),
    projectName: project.title,
  }
}

export default function ProjectDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const project = useMemo(
    () => location.state?.project || { id, title: "Project", description: "No description" },
    [id, location.state?.project]
  )

  const isPM = canCreateProjectsAndTasks(user)
  const isTeamMember = !isPM && !isAdmin(user)

  const [allTasks, setAllTasks] = useState([])
  const [workload, setWorkload] = useState([])
  const [assignableUsers, setAssignableUsers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [progress, setProgress] = useState({ planned: 0, actual: 0 })
  const [membersCount, setMembersCount] = useState(0)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [projectMembersList, setProjectMembersList] = useState([])
  const [memberEmail, setMemberEmail] = useState("")
  const [memberRole, setMemberRole] = useState("team member")
  const [addingMember, setAddingMember] = useState(false)
  const [removingMember, setRemovingMember] = useState(false)
  const [projectCreatorId, setProjectCreatorId] = useState(null)
  const [projectStats, setProjectStats] = useState({ totalTasks: 0, doneTasks: 0, inProgressTasks: 0, todoTasks: 0 })
  const [myTasksStats, setMyTasksStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 })
  const [projectData, setProjectData] = useState(project)

  // جيب كل بيانات المشروع من dashboard API
  useEffect(() => {
    let mounted = true
    const loadProjectData = async () => {
      try {
        const res = await getProjectDashboard(project.id ?? id)
        console.log("Project Dashboard:", res)
        
        const data = res?.data?.data ?? res?.data ?? {}
        const tasksList = data.tasks ?? []
        const membersList = data.members ?? []
        const stats = data.stats ?? {}
        const projectInfo = data.project ?? {}
        
        if (mounted) {
          setAllTasks(tasksList.map((item) => normalizeTask(item, project)))
          setMembersCount(membersList.length)
          setProjectMembersList(membersList)
          setProjectCreatorId(projectInfo.createdBy || membersList[0]?.userId)
          setProjectStats({
            totalTasks: stats.totalTasks ?? 0,
            doneTasks: stats.doneTasks ?? 0,
            inProgressTasks: stats.inProgressTasks ?? 0,
            todoTasks: stats.todoTasks ?? 0,
          })
          
          const progressRes = await getProjectProgress(project.id ?? id)
          const progressData = progressRes?.data?.data ?? progressRes?.data ?? {}
          console.log("Progress data from API:", progressData)
          setProgress({
            planned: Math.max(0, Math.min(100, Number(progressData.planned ?? 0))),
            actual: Math.max(0, Math.min(100, Number(progressData.actual ?? 0))),
          })
          
          if (isPM) {
            setAssignableUsers(
              membersList
                .filter((m) => {
                  const r = String(m.role ?? "").toLowerCase().replace(/[\s_]/g, "")
                  return r === "teammember" || r === "member" || r === "user"
                })
                .map((m) => ({ id: m.userId ?? m.id, name: m.userName ?? m.name ?? m.email }))
            )
          }
        }
      } catch (error) {
        console.error("Failed to load project data:", error)
        showToast(getApiErrorParts(error, "Failed to load project").title, "danger")
      }
    }
    
    loadProjectData()
    return () => { mounted = false }
  }, [id, project.id, isPM, showToast])

  // جيب الـ workload
  useEffect(() => {
    if (!isPM) return
    let mounted = true
    getProjectWorkloads(project.id ?? id)
      .then((res) => {
        const raw = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data : []
        if (!mounted) return
        setWorkload(raw.map((w, i) => ({
          name: w.name ?? w.userName ?? `Member ${i + 1}`,
          completed: w.completed ?? w.done ?? 0,
          remaining: w.remaining ?? w.inProgress ?? 0,
          overdue: w.overdue ?? w.late ?? 0,
        })))
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [id, isPM, project.id])

  // فلتر التاسكات للـ Team Member
  useEffect(() => {
    if (isTeamMember) {
      const filtered = allTasks.filter(t => 
        t.assignedTo === user?.id || 
        t.assignedUserId === user?.id ||
        t.assignedUserName === user?.email
      )
      
      const completed = filtered.filter(t => t.status === "done").length
      const inProgress = filtered.filter(t => t.status === "progress").length
      const pending = filtered.filter(t => t.status === "todo").length
      
      setMyTasksStats({
        total: filtered.length,
        completed,
        inProgress,
        pending
      })
    }
  }, [allTasks, user?.id, isTeamMember])

  // جيب بيانات المشروع لو مجتش من الـ state
useEffect(() => {
  const fetchProject = async () => {
    if (!project.id || project.title === "Project" || project.description === "No description") {
      try {
        const res = await getProjectDashboard(id)
        const data = res?.data?.data ?? res?.data ?? {}
        const projectInfo = data.project ?? {}
        setProjectData({
          id: projectInfo.id || id,
          title: projectInfo.name || projectInfo.title || "Project",
          description: projectInfo.description || ""
        })
        // خزن في sessionStorage
        sessionStorage.setItem(`project_${id}`, JSON.stringify({
          id: projectInfo.id || id,
          title: projectInfo.name || projectInfo.title || "Project",
          description: projectInfo.description || ""
        }))
      } catch (error) {
        console.error("Failed to fetch project:", error)
        // حاول تجيب من sessionStorage
        const cached = sessionStorage.getItem(`project_${id}`)
        if (cached) {
          setProjectData(JSON.parse(cached))
        }
      }
    } else {
      setProjectData(project)
      sessionStorage.setItem(`project_${id}`, JSON.stringify(project))
    }
  }
  fetchProject()
}, [id, project])

  // دالة جلب الأعضاء
  const fetchMembersList = async () => {
    try {
      const res = await getProjectDashboard(project.id ?? id)
      const members = res?.data?.data?.members ?? []
      setProjectMembersList(members)
      setShowMembersModal(true)
    } catch (error) {
      showToast("Failed to load members list", "error")
    }
  }

  // دالة إضافة member بالإيميل مباشرة
  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      showToast("Please enter user email", "error")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberEmail)) {
      showToast("Please enter a valid email", "error")
      return
    }
    
    setAddingMember(true)
    try {
      const dashboardRes = await getProjectDashboard(project.id ?? id)
      const currentMembers = dashboardRes?.data?.data?.members ?? []
      
      const userExists = currentMembers.some(m => 
        m.email === memberEmail || m.userName === memberEmail
      )
      
      if (userExists) {
        showToast("User is already a member of this project", "warning")
        setAddingMember(false)
        return
      }
      
      console.log("Adding member with email:", {
        projectId: Number(project.id ?? id),
        email: memberEmail,
        role: memberRole
      })
      
      const res = await addMemberByEmail({
        projectId: Number(project.id ?? id),
        email: memberEmail,
        role: memberRole
      })
      
      console.log("Add member response:", res)
      
      if (res?.data?.statusCode === 201 || res?.statusCode === 201 || res?.data?.userId) {
        showToast(`Member added successfully`, "success")
        setShowAddMemberModal(false)
        setMemberEmail("")
        
        const refreshedRes = await getProjectDashboard(project.id ?? id)
        const data = refreshedRes?.data?.data ?? refreshedRes?.data ?? {}
        const membersList = data.members ?? []
        setMembersCount(membersList.length)
        setProjectMembersList(membersList)
        
        if (isPM) {
          setAssignableUsers(
            membersList
              .filter((m) => {
                const r = String(m.role ?? "").toLowerCase().replace(/[\s_]/g, "")
                return r === "teammember" || r === "member" || r === "user"
              })
              .map((m) => ({ id: m.userId ?? m.id, name: m.userName ?? m.name ?? m.email }))
          )
        }
      } else {
        showToast("Failed to add member", "error")
      }
    } catch (err) {
      console.error("Add member error:", err)
      const errorMsg = err.response?.data?.message || err.response?.data?.title || "Failed to add member"
      showToast(errorMsg, "danger")
    } finally {
      setAddingMember(false)
    }
  }

  // دالة حذف member
  const handleRemoveMember = async (userId, userName, userRole) => {
    const isCreator = userId === projectCreatorId
    const isCurrentUser = userId === user?.id
    const isProjectManager = userRole?.toLowerCase() === "project manager"
    const currentUserIsCreator = user?.id === projectCreatorId
    
    if (isCreator) {
      showToast("Cannot remove the project creator", "warning")
      return
    }
    
    if (isCurrentUser) {
      showToast("You cannot remove yourself from the project", "warning")
      return
    }
    
    if (!currentUserIsCreator) {
      if (isProjectManager) {
        showToast("You cannot remove another Project Manager", "warning")
        return
      }
    }
    
    if (!window.confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return
    }
    
    setRemovingMember(true)
    try {
      await removeProjectMember({
        projectId: Number(project.id ?? id),
        userId: userId
      })
      
      showToast(`Member ${userName} removed successfully`, "success")
      
      const dashboardRes = await getProjectDashboard(project.id ?? id)
      const data = dashboardRes?.data?.data ?? dashboardRes?.data ?? {}
      const membersList = data.members ?? []
      setMembersCount(membersList.length)
      setProjectMembersList(membersList)
      
      if (isPM) {
        setAssignableUsers(
          membersList
            .filter((m) => {
              const r = String(m.role ?? "").toLowerCase().replace(/[\s_]/g, "")
              return r === "teammember" || r === "member" || r === "user"
            })
            .map((m) => ({ id: m.userId ?? m.id, name: m.userName ?? m.name ?? m.email }))
        )
      }
      
      setShowMembersModal(false)
    } catch (err) {
      console.error("Remove member error:", err)
      showToast(getApiErrorParts(err, "Failed to remove member").title, "danger")
    } finally {
      setRemovingMember(false)
    }
  }

  if (isAdmin(user)) return <Navigate to={`/admin/projects/${id}`} replace />

  // التاسكات المعروضة (كلها للـ PM، أو بتاعته للـ Team Member)
  const displayedTasks = isTeamMember ? allTasks.filter(t => 
    t.assignedTo === user?.id || 
    t.assignedUserId === user?.id ||
    t.assignedUserName === user?.email
  ) : allTasks

  const todo = displayedTasks.filter((t) => t.status === "todo")
  const inProgress = displayedTasks.filter((t) => t.status === "progress")
  const done = displayedTasks.filter((t) => t.status === "done")

  const addTask = async ({ title, description, priority, dueDate }) => {
    try {
      const res = await createTask({
        title, description, priority,
        assignedTo: null,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        projectId: Number(project.id ?? id),
      })
      const newTask = normalizeTask(res?.data?.data ?? res?.data ?? { title, description, priority, status: "todo" }, project)
      setAllTasks((prev) => [...prev, newTask])
      showToast("Task created")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to create task").title, "danger")
    }
  }
  
  const removeTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      setAllTasks((prev) => prev.filter((t) => String(t.id) !== String(taskId)))
      showToast("Task deleted")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to delete task").title, "danger")
    }
  }

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id)
      showToast("Project deleted")
      navigate("/projects", { replace: true })
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to delete project").title, "danger")
    }
  }

  return (
    <Layout>
      <div className="project-detail-page">
        <Link to="/projects" className="breadcrumb-link">
          <RiArrowLeftLine aria-hidden /> Back to projects
        </Link>

        <div className="project-header">
          <div>
           <h1 className="dashboard-title">{projectData.title}</h1>
            <p className="page-lede">{projectData.description}</p>  
            <div className="project-stats" style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bi bi-people-fill"></i> {membersCount} Members
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bi bi-clipboard"></i> {projectStats.totalTasks} Total Tasks
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bi bi-check-circle-fill text-success"></i> {projectStats.doneTasks} Completed
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="bi bi-arrow-repeat text-warning"></i> {projectStats.inProgressTasks} In Progress
              </span>
            </div>
          </div>
          {isPM ? (
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">+ Add task</button>
              <button type="button" onClick={() => setShowAddMemberModal(true)} className="btn btn-primary">+ Add member</button>
              <button type="button" onClick={fetchMembersList} className="btn btn-danger">
                <RiTeamLine /> Members ({membersCount})
              </button>
              <button type="button" onClick={handleDeleteProject} className="btn btn-danger">Delete project</button>
            </div>
          ) : null}
        </div>

        {/* Team Member Stats */}
        {isTeamMember && myTasksStats.total > 0 && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center p-3">
                <h4>{myTasksStats.total}</h4>
                <p>My Tasks</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3">
                <h4 className="text-success">{myTasksStats.completed}</h4>
                <p>Completed</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3">
                <h4 className="text-warning">{myTasksStats.inProgress}</h4>
                <p>In Progress</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center p-3">
                <h4 className="text-secondary">{myTasksStats.pending}</h4>
                <p>Pending</p>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board - بدون DragDropContext */}
        <div className="card kanban-wrapper">
          <div className="board">
            <Column 
              title="To Do" 
              tasks={todo} 
              project={project} 
              id="todo" 
              onDelete={removeTask} 
              canDeleteTask={isPM} 
              canDragTask={false} 
            />
            <Column 
              title="In Progress" 
              tasks={inProgress} 
              project={project} 
              id="progress" 
              onDelete={removeTask} 
              canDeleteTask={isPM} 
              canDragTask={false} 
            />
            <Column 
              title="Done" 
              tasks={done} 
              project={project} 
              id="done" 
              onDelete={removeTask} 
              canDeleteTask={isPM} 
              canDragTask={false} 
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
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
          </div>

          <div className="col-md-6">
            {isPM && workload.length > 0 ? (
              <div className="card">
                <h3>Team Workload</h3>
                {workload.map((w, i) => (
                  <div key={i} className="progress-line">
                    <span>{w.name}</span>
                    <div className="stack-bar">
                      <div className="blue" style={{ width: w.completed + "%" }} />
                      <div className="green" style={{ width: w.remaining + "%" }} />
                      <div className="gray" style={{ width: w.overdue + "%" }} />
                    </div>
                  </div>
                ))}
                <div className="legend">
                  <div><span className="blue"></span> Completed</div>
                  <div><span className="green"></span> Remaining</div>
                  <div><span className="gray"></span> Overdue</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isPM ? (
          <AddTaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={addTask}
            assignees={assignableUsers}
          />
        ) : null}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="tf-dialog-root" role="presentation">
            <button type="button" className="tf-dialog-backdrop" onClick={() => setShowAddMemberModal(false)} />
            <div className="tf-dialog" role="dialog" style={{ maxWidth: "500px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Add Team Member</h3>
                <button type="button" onClick={() => setShowAddMemberModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem" }}>×</button>
              </div>
              
              <div className="mb-3">
                <label className="form-label">User Email</label>
                <input 
                  type="email" 
                  className="input" 
                  value={memberEmail} 
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Enter user email"
                  autoComplete="off"
                />
                <small className="text-muted">The user must exist in the system</small>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Role in Project</label>
                <select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="team member">Team Member</option>
                  <option value="project manager">Project Manager</option>
                </select>
              </div>
              
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddMember}
                  disabled={!memberEmail.trim() || addingMember}
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List Modal */}
        {showMembersModal && (
          <div className="tf-dialog-root" role="presentation">
            <button type="button" className="tf-dialog-backdrop" onClick={() => setShowMembersModal(false)} />
            <div className="tf-dialog" role="dialog" style={{ maxWidth: "600px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Project Members ({projectMembersList.length})</h3>
                <button type="button" onClick={() => setShowMembersModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem" }}>×</button>
              </div>
              
              <div className="members-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {projectMembersList.length === 0 ? (
                  <p className="text-muted text-center py-4">No members in this project</p>
                ) : (
                  <div className="list-group">
                    {projectMembersList.map((member) => {
                      const isCreator = member.userId === projectCreatorId
                      const isCurrentUser = member.userId === user?.id
                      const isProjectManager = member.role?.toLowerCase() === "project manager"
                      const currentUserIsCreator = user?.id === projectCreatorId
                      
                      let showRemoveButton = false
                      if (!isCreator && !isCurrentUser) {
                        if (currentUserIsCreator) {
                          showRemoveButton = true
                        } else if (!isProjectManager) {
                          showRemoveButton = true
                        }
                      }
                      
                      return (
                        <div key={member.userId || member.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <strong>
                              {member.userName || member.name}
                              {isCreator && <span className="badge bg-warning ms-2">Creator</span>}
                              {isCurrentUser && <span className="badge bg-info ms-2">You</span>}
                            </strong>
                            <br />
                            <small className="text-muted">{member.email || member.userName}</small>
                            <div>
                              <span className={`badge ${isProjectManager ? "bg-primary" : "bg-secondary"} mt-1`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                          <div>
                            {showRemoveButton && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRemoveMember(member.userId || member.id, member.userName || member.name, member.role)}
                                disabled={removingMember}
                              >
                                <RiDeleteBinLine /> Remove 
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMembersModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}