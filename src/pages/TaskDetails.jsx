import Layout from "../layout/Layout"
import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { isAdmin, canCreateProjectsAndTasks } from "../utils/roles"
import { normalizeTaskDetail, formatPriorityLabel, priorityToBadgeClass } from "../utils/taskDisplay"
import { FaRegCommentDots } from "react-icons/fa"
import { FiPaperclip, FiDownload } from "react-icons/fi"
import { FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFileAlt } from "react-icons/fa"
import { RiArrowLeftLine, RiUserLine, RiCalendarEventLine, RiFlagLine, RiCheckboxCircleLine } from "react-icons/ri"
import { requestWithFallback } from "../services/requestWithFallback"
import { updateTask, assignTask } from "../services/taskService"
import { getProjectMembers } from "../services/projectService"
import { useToast } from "../context/ToastContext"
import { getApiErrorParts } from "../utils/apiError"
import api from "../services/api"

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ?? ""

const getComments = (taskId) =>
  requestWithFallback([{ method: "get", url: `/comments`, config: { params: { taskId } } }])

const postComment = (taskId, content) =>
  requestWithFallback([{ method: "post", url: `/comments?taskId=${taskId}`, data: { content } }])

const removeComment = (commentId) =>
  requestWithFallback([{ method: "delete", url: `/comments/${commentId}` }])

const getAttachments = (taskId) =>
  requestWithFallback([{ method: "get", url: `/attachments`, config: { params: { taskId } } }])

const removeAttachment = (attachmentId) =>
  requestWithFallback([{ method: "delete", url: `/attachments/${attachmentId}` }])

const uploadAttachment = (taskId, file) => {
  const form = new FormData()
  form.append("file", file)
  return api.post(`/attachments?taskId=${taskId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

function formatDueDate(raw) {
  if (!raw) return "—"
  try {
    return new Date(raw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return raw
  }
}

export default function TaskDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [taskData, setTaskData] = useState(() => {
    const raw = location.state?.task || { id, title: "Task", description: "", status: "todo", priority: "medium", assignedTo: "", dueDate: "", projectId: null }
    const normalized = normalizeTaskDetail(raw, id)
    return {
      ...normalized,
      assignedTo: raw.assignedUserName ?? raw.assignedTo ?? normalized.assignedTo ?? "",
      assignedUserId: raw.assignedTo ?? null,
      assignedUserName: raw.assignedUserName ?? null,
      priority: String(raw.priority ?? normalized.priority ?? "medium").toLowerCase(),
      description: raw.description ?? normalized.description ?? "",
    }
  })

  const task = taskData
  const isPM = canCreateProjectsAndTasks(user)
  
  // تحقق إذا كان التاسك معمول assign للمستخدم الحالي
  const isMyTask = useMemo(() => {
    return task.assignedUserId === user?.id || 
           task.assignedTo === user?.id ||
           task.assignedUserName === user?.email ||
           task.assignedTo === user?.email
  }, [task.assignedUserId, task.assignedTo, task.assignedUserName, user?.id, user?.email])

  const [priorityVal, setPriorityVal] = useState(task.priority ?? "medium")
  const [statusVal, setStatusVal] = useState(task.status ?? "todo")
  const [assigneeId, setAssigneeId] = useState("")
  const [projectMembers, setProjectMembers] = useState([])
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [files, setFiles] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  // التحقق من هل التاسك متأخر (overdue)
  const isTaskOverdue = useMemo(() => {
    if (!taskData.dueDate) return false
    if (taskData.status === "done") return false
    try {
      const dueDate = new Date(taskData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate < today
    } catch {
      return false
    }
  }, [taskData.dueDate, taskData.status])

  // هل الـ PM يقدر يغير الـ assignee؟
  const canChangeAssignee = useMemo(() => {
    if (!isPM) return false
    if (taskData.status === "done") return false
    if (taskData.status === "progress") {
      return isTaskOverdue
    }
    return true
  }, [isPM, taskData.status, isTaskOverdue])

  // هل يظهر الـ select ولا الاسم بس؟
  const showAssigneeSelect = useMemo(() => {
    return isPM && (taskData.status === "todo" || (taskData.status === "progress" && isTaskOverdue))
  }, [isPM, taskData.status, isTaskOverdue])

  // هل يظهر الـ status select للـ Team Member
  const showStatusSelect = useMemo(() => {
    // Team Member يقدر يغير status بس لو التاسك بتاعه
    return !isPM && isMyTask && taskData.status !== "todo"
  }, [isPM, isMyTask, taskData.status])

  // هل يظهر الـ add comment للـ Team Member
  const canAddComment = useMemo(() => {
    return isPM || isMyTask
  }, [isPM, isMyTask])

  // هل يظهر الـ attachments للـ Team Member
  const canAddAttachments = useMemo(() => {
    return isPM || isMyTask
  }, [isPM, isMyTask])

  // جلب تفاصيل التاسك
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await requestWithFallback([
          { method: "get", url: `/task/${id}` },
          { method: "get", url: `/Task/GetById/${id}` },
          { method: "get", url: "/Task/GetById", config: { params: { id } } },
        ])
        
        const raw = res?.data?.data ?? res?.data ?? {}
        if (!raw || !raw.id) return
        
        const normalized = normalizeTaskDetail(raw, id)
        const assignedUserName = raw.assignedUserName ?? raw.assignedToName ?? null
        const assignedUserId = raw.assignedTo ?? raw.assignedUserId ?? null
        const projectIdFromTask = raw.projectId ?? location.state?.projectId
        
       // خزن الـ projectId في sessionStorage
        if (projectIdFromTask) {
          sessionStorage.setItem('currentProjectId', projectIdFromTask)
        }
        
        setTaskData({
          ...normalized,
          assignedTo: assignedUserName || "Unassigned",
          assignedUserId: assignedUserId,
          assignedUserName: assignedUserName,
          priority: String(raw.priority ?? normalized.priority ?? "medium").toLowerCase(),
          description: raw.description ?? normalized.description ?? "",
          projectId: projectIdFromTask || normalized.projectId,
        })
        
        setPriorityVal(raw.priority ?? "medium")
        setStatusVal(raw.status ?? "todo")
        
        if (assignedUserId) {
          setAssigneeId(assignedUserId)
        }
      } catch (error) {
        console.error("Error fetching task:", error)
      }
    }
    fetchTask()
  }, [id, location.state?.projectId])

  // جلب أعضاء المشروع
  useEffect(() => {
    const projectId = task.projectId ?? location.state?.projectId
    if (!projectId || !isPM) return
    
    let mounted = true
    getProjectMembers(projectId)
      .then((res) => {
        const raw = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : []
        
        const members = raw
          .filter((m) => {
            const role = String(m.role ?? "").toLowerCase().replace(/[\s_]/g, "")
            return role === "teammember" || role === "member" || role === "user"
          })
          .map((m) => ({ 
            id: m.userId ?? m.id, 
            name: m.userName ?? m.name ?? m.fullName ?? m.email ?? "Unknown" 
          }))
        
        if (mounted) {
          setProjectMembers(members)
        }
      })
      .catch(() => {})
    
    return () => { mounted = false }
  }, [task.projectId, location.state?.projectId, isPM])

  // تابع تغييرات status من taskData
  useEffect(() => {
    if (taskData.status && taskData.status !== statusVal) {
      setStatusVal(taskData.status)
    }
  }, [taskData.status])

  // جلب التعليقات
  useEffect(() => {
    getComments(id)
      .then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : []
        setComments(list.map((c) => ({
          id: c.id ?? c.commentId,
          user: c.userName ?? c.user ?? "User",
          text: c.content ?? c.text ?? "",
          time: c.createdAt ? new Date(c.createdAt) : new Date(),
        })))
      })
      .catch(() => {})
  }, [id])

  // جلب المرفقات
  useEffect(() => {
    getAttachments(id)
      .then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data : []
        setFiles(list.map((f) => ({
          id: f.id ?? f.attachmentId,
          name: f.fileName ?? f.name ?? "file",
          url: f.fileUrl ?? f.url ?? "",
          fromApi: true,
        })))
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") setPreviewImage(null) }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  const handlePriorityChange = async (val) => {
    setPriorityVal(val)
    try {
      await requestWithFallback([
        { method: "post", url: "/task/change-priority", data: { taskId: Number(task.id), priority: val } },
      ])
      showToast("Priority updated")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to update priority").title, "danger")
    }
  }

  const handleStatusChange = async (val) => {
    // Team Member ميقدرش يحول من In Progress لـ To Do
    if (!isPM && taskData.status === "progress" && val === "todo") {
      showToast("Cannot move back to To Do from In Progress", "warning")
      return
    }
    
    // Team Member ميقدرش يحول من Done لـ حاجة تانية
    if (!isPM && taskData.status === "done") {
      showToast("Cannot change status of completed task", "warning")
      return
    }
    
    setStatusVal(val)
    try {
      await updateTask({ id: task.id, status: val })
      showToast("Status updated")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to update status").title, "danger")
    }
  }

  const handleAssigneeChange = async (val) => {
    if (!canChangeAssignee) {
      showToast("Cannot change assignee for this task", "warning")
      return
    }
    
    setAssigneeId(val)
    const selectedMember = projectMembers.find(m => m.id === val)
    const assigneeName = selectedMember?.name || (val ? "Assigned" : "Unassigned")
    
    const taskIdNum = Number(task.id)
    const requestData = {
      taskId: taskIdNum,
      assignedTo: val
    }
    
    try {
      const assignRes = await api.post("/task/assign", requestData, {
        headers: { "Content-Type": "application/json" }
      })
      
      if (assignRes?.data?.statusCode === 200) {
        if (taskData.status === "todo" && val) {
          await updateTask({ id: task.id, status: "progress" })
          setStatusVal("progress")
          setTaskData(prev => ({ ...prev, status: "progress" }))
        }
        
        showToast(`Task assigned to ${assigneeName}`, "success")
        setTaskData(prev => ({ 
          ...prev, 
          assignedTo: assigneeName,
          assignedUserName: assigneeName,
          assignedUserId: val 
        }))
      }
    } catch (err) {
      console.error("Error response:", err.response?.data)
      showToast(err.response?.data?.message || "Failed to assign task", "danger")
    }
  }

   const handleGoBack = () => {
  // جيب الـ projectId من أكتر من مكان
    const projectId = task.projectId || 
                      location.state?.projectId || 
                      location.state?.task?.projectId ||
                      sessionStorage.getItem('currentProjectId')
    
    console.log("Going back to project ID:", projectId)
    
    if (projectId && projectId !== "null" && projectId !== "undefined") {
      navigate(`/projects/${projectId}`)
    } else {
      navigate('/projects')
    }
  }

  const handleAddComment = async () => {
    if (!canAddComment) {
      showToast("You cannot comment on this task", "warning")
      return
    }
    if (!newComment.trim()) return
    try {
      const res = await postComment(id, newComment.trim())
      const c = res?.data?.data ?? res?.data ?? {}
      setComments((prev) => [...prev, {
        id: c.id ?? Date.now(),
        user: c.userName ?? user?.fullName ?? "You",
        text: newComment.trim(),
        time: new Date(),
      }])
      setNewComment("")
    } catch (err) {
      showToast(getApiErrorParts(err, "Failed to post comment").title, "danger")
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await removeComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {}
  }

  const handleFileUpload = async (e) => {
    if (!canAddAttachments) {
      showToast("You cannot add attachments to this task", "warning")
      return
    }
    const file = e.target.files[0]
    if (!file) return
    try {
      const res = await uploadAttachment(id, file)
      const f = res?.data?.data ?? res?.data ?? {}
      setFiles((prev) => [...prev, {
        id: f.id ?? f.attachmentId ?? Date.now(),
        name: f.fileName ?? file.name,
        url: f.fileUrl ?? f.url ?? "",
        fromApi: true,
      }])
      showToast("File uploaded")
    } catch (_) {
      setFiles((prev) => [...prev, { id: Date.now(), name: file.name, file, fromApi: false }])
    }
  }

  const handleDeleteFile = async (fileId, fromApi) => {
    if (fromApi) {
      try { await removeAttachment(fileId) } catch {}
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const downloadFile = (f) => {
    if (f.url) {
      window.open(f.url.startsWith("http") ? f.url : `${BASE_URL}${f.url}`, "_blank")
    } else if (f.file) {
      const url = URL.createObjectURL(f.file)
      const a = document.createElement("a")
      a.href = url; a.download = f.name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    }
  }

  const getFileIcon = (name) => {
    const ext = (name || "").split(".").pop().toLowerCase()
    if (ext === "pdf") return <FaFilePdf className="file-type pdf" />
    if (["png","jpg","jpeg","gif"].includes(ext)) return <FaFileImage className="file-type image" />
    if (["doc","docx"].includes(ext)) return <FaFileWord className="file-type word" />
    if (["xls","xlsx"].includes(ext)) return <FaFileExcel className="file-type excel" />
    return <FaFileAlt className="file-type default" />
  }

  const timeAgo = (date) => {
    const m = Math.floor((new Date() - date) / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m} min ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} hours ago`
    return `${Math.floor(h / 24)} days ago`
  }

  const priorityBadgeClass = priorityToBadgeClass(priorityVal)
  const priorityLabel = formatPriorityLabel(priorityVal)
  const statusLabelMap = { todo: "To Do", progress: "In Progress", done: "Done" }

  // اسم الـ assignee المعروض
  const assigneeDisplayName = useMemo(() => {
    if (taskData.assignedUserName && taskData.assignedUserName !== "Unassigned") {
      return taskData.assignedUserName
    }
    if (taskData.assignedTo && taskData.assignedTo !== "Unassigned") {
      return taskData.assignedTo
    }
    if (assigneeId) {
      const member = projectMembers.find(m => m.id === assigneeId)
      if (member) return member.name
    }
    return "Unassigned"
  }, [taskData.assignedUserName, taskData.assignedTo, assigneeId, projectMembers])

  if (isAdmin(user)) return <Navigate to="/dashboard" replace />

  // إذا كان Team Member والتاسك مش بتاعه، يظهر رسالة
  if (!isPM && !isMyTask && taskData.id) {
    return (
      <Layout>
        <div className="task-detail-page">
          <nav className="task-breadcrumbs" aria-label="Breadcrumb">
            <button onClick={handleGoBack} className="breadcrumb-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <RiArrowLeftLine aria-hidden /> Back to Tasks
            </button>
          </nav>
          <div className="card text-center py-5 mt-4">
            <RiUserLine size={48} className="text-muted mb-3" />
            <h3>Access Denied</h3>
            <p className="text-muted">You don't have permission to view this task.</p>
            <button onClick={handleGoBack} className="btn btn-primary mt-3">Go Back</button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="task-detail-page">
        <nav className="task-breadcrumbs" aria-label="Breadcrumb">
          <button onClick={handleGoBack} className="breadcrumb-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <RiArrowLeftLine aria-hidden /> Back to Tasks
          </button>
        </nav>

        <header className="task-detail-header">
          <p className="task-detail-id">Task ID · {task.id}</p>
          <h1 className="dashboard-title">{task.title}</h1>
          <p className="page-lede">{task.description || ""}</p>
        </header>

        <div className="task-meta-strip card">
          {/* Assignee Section */}
          <div className="task-meta-item">
            <RiUserLine aria-hidden />
            <div>
              <span className="task-meta-label">Assignee</span>
              
              {showAssigneeSelect ? (
                <select 
                  className="input task-priority-select" 
                  value={assigneeId || ""} 
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                >
                  <option value="">-- Select Team Member --</option>
                  {projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <span className="task-meta-value">
                  {assigneeDisplayName}
                  {taskData.status === "progress" && !isTaskOverdue && isPM && (
                    <small style={{ display: "block", fontSize: "11px", color: "#f59e0b" }}>
                      ⚠️ Cannot change assignee while task is In Progress
                    </small>
                  )}
                  {taskData.status === "progress" && isTaskOverdue && isPM && (
                    <small style={{ display: "block", fontSize: "11px", color: "#f59e0b" }}>
                      ⚠️ Task is overdue - you can reassign it
                    </small>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Priority Section - PM بس يقدر يغير */}
          <div className="task-meta-item">
            <RiFlagLine aria-hidden />
            <div>
              <span className="task-meta-label">Priority</span>
              {isPM ? (
                <select className={`input task-priority-select ${priorityBadgeClass}`} value={priorityVal} onChange={(e) => handlePriorityChange(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span className={`badge ${priorityBadgeClass}`}>{priorityLabel}</span>
              )}
            </div>
          </div>

          {/* Status Section - الـ PM بيشوف badge فقط */}
          <div className="task-meta-item">
            <RiCheckboxCircleLine aria-hidden />
            <div>
              <span className="task-meta-label">Status</span>
              {showStatusSelect ? (
                <select 
                  className="input task-priority-select" 
                  value={statusVal} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <span className={`badge ${
                  statusVal === "progress" ? "status-inprogress" :
                  statusVal === "done" ? "status-done" :
                  "status-todo"
                }`}>
                  {statusLabelMap[statusVal] || statusVal || "To Do"}
                </span>
              )}
            </div>
          </div>
          {/* Due Date Section */}
          <div className="task-meta-item">
            <RiCalendarEventLine aria-hidden />
            <div>
              <span className="task-meta-label">Due</span>
              <span className={`task-meta-value ${isTaskOverdue && taskData.status !== "done" ? "text-danger" : ""}`}>
                {formatDueDate(taskData.dueDate)}
                {isTaskOverdue && taskData.status !== "done" && (
                  <span style={{ marginLeft: "8px", fontSize: "12px", color: "#dc2626" }}>(Overdue)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {isTaskOverdue && taskData.status !== "done" && isPM && (
          <div className="alert alert-warning" style={{ marginBottom: "1rem", fontSize: "14px" }}>
            ⚠️ This task is overdue. You can reassign it to another team member.
          </div>
        )}

        {/* Attachments Section - للـ Team Member بس لو التاسك بتاعه */}
        {(isPM || canAddAttachments) && (
          <section className="card task-panel">
            <h3 className="task-panel-title">Attachments</h3>
            <div className="attachments-list">
              {files.length === 0 ? <p className="empty-files">No attachments yet — upload relevant files.</p> : null}
              {files.map((f) => {
                const isImg = (f.name || "").match(/\.(jpg|jpeg|png|gif)$/i)
                return (
                  <div key={f.id} className="file-item">
                    {getFileIcon(f.name)}
                    <span className="file-name">{f.name}</span>
                    {isImg ? <button type="button" className="file-preview" onClick={() => {
                      const url = f.url ? (f.url.startsWith("http") ? f.url : `${BASE_URL}${f.url}`) : (f.file ? URL.createObjectURL(f.file) : null)
                      if (url) setPreviewImage(url)
                    }}>Preview</button> : null}
                    <button type="button" className="file-download" onClick={() => downloadFile(f)}><FiDownload /> Download</button>
                    <button type="button" className="file-delete" onClick={() => handleDeleteFile(f.id, f.fromApi)}>Delete</button>
                  </div>
                )
              })}
            </div>
            <label className="upload-btn">
              <FiPaperclip className="file-icon" aria-hidden />
              Upload file
              <input type="file" onChange={handleFileUpload} hidden />
            </label>
          </section>
        )}

        {/* Comments Section - للـ Team Member بس لو التاسك بتاعه */}
        {(isPM || canAddComment) && (
          <section className="card task-panel">
            <h3 className="task-panel-title">
              <FaRegCommentDots style={{ marginRight: "0.35rem" }} /> Comments
            </h3>
            <div className="comment-input">
              <textarea placeholder="Write an update for your team…" className="textarea" value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
              <button type="button" className="btn btn-primary" onClick={handleAddComment}>Post comment</button>
            </div>
            <button type="button" className="comment-toggle" onClick={() => setShowComments(!showComments)}>
              <FaRegCommentDots /> {comments.length} {showComments ? "Hide thread" : "Show thread"}
            </button>
            {showComments ? (
              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">{String(c.user)[0]?.toUpperCase()}</div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-user">{c.user}</span>
                        <span className="comment-time">{timeAgo(c.time)}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                      {(user?.fullName === c.user || user?.email === c.user) ? (
                        <button type="button" className="file-delete" style={{ marginTop: "0.25rem" }} onClick={() => handleDeleteComment(c.id)}>Delete</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}
      </div>

      {previewImage ? (
        <div className="preview-modal" role="dialog" aria-modal onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="preview-close" onClick={() => setPreviewImage(null)} aria-label="Close">✕</button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      ) : null}
    </Layout>
  )
}