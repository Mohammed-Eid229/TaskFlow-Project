import Layout from "../layout/Layout"
import { Link, Navigate, useParams, useLocation } from "react-router-dom"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { isAdmin, canCreateProjectsAndTasks } from "../utils/roles"
import { getDemoTask } from "../data/demoTasks"
import {
  normalizeTaskDetail,
  formatPriorityLabel,
  priorityToBadgeClass,
} from "../utils/taskDisplay"
import { FaRegCommentDots } from "react-icons/fa"
import { FiPaperclip, FiDownload } from "react-icons/fi"
import {
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
} from "react-icons/fa"
import {
  RiArrowLeftLine,
  RiUserLine,
  RiCalendarEventLine,
  RiFlagLine,
  RiCheckboxCircleLine,
} from "react-icons/ri"

export default function TaskDetails() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()

  const task = useMemo(() => {
    const fromBoard = location.state?.task
    const seed = getDemoTask(id)
    const raw =
      fromBoard ||
      seed || {
        id,
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        assignedTo: "Unassigned",
        dueDate: "",
        projectId: "1",
        projectName: "Website Redesign",
      }
    return normalizeTaskDetail(raw, id)
  }, [id, location.state])

  const [priorityPm, setPriorityPm] = useState(null)

  useEffect(() => {
    setPriorityPm(null)
  }, [task.id])

  const isPM = canCreateProjectsAndTasks(user)
  const effectivePriority = priorityPm ?? task.priority
  const priorityLabel = formatPriorityLabel(effectivePriority)
  const priorityBadgeClass = priorityToBadgeClass(effectivePriority)

  const [comments, setComments] = useState([
    {
      id: 1,
      user: "Ahmed",
      text: "Started working on this task",
      time: new Date(),
    },
    {
      id: 2,
      user: "Mohamed",
      text: "UI draft completed",
      time: new Date(),
    },
  ])

  const [showComments, setShowComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [files, setFiles] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  const addComment = () => {
    if (!newComment.trim()) return
    setComments([
      ...comments,
      {
        id: Date.now(),
        user: "You",
        text: newComment.trim(),
        time: new Date(),
      },
    ])
    setNewComment("")
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFiles([
      ...files,
      { id: Date.now(), name: file.name, file },
    ])
  }


  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  const downloadFile = (file) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase()
    if (ext === "pdf") return <FaFilePdf className="file-type pdf" />
    if (["png", "jpg", "jpeg", "gif"].includes(ext))
      return <FaFileImage className="file-type image" />
    if (["doc", "docx"].includes(ext))
      return <FaFileWord className="file-type word" />
    if (["xls", "xlsx"].includes(ext))
      return <FaFileExcel className="file-type excel" />
    return <FaFileAlt className="file-type default" />
  }

  const handlePreview = (file) => {
    setPreviewImage(URL.createObjectURL(file))
  }

  const deleteFile = (fid) => {
    setFiles(files.filter((f) => f.id !== fid))
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setPreviewImage(null)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  if (isAdmin(user)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Layout>
      <div className="task-detail-page">
        <nav className="task-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/projects" className="breadcrumb-link">
            <RiArrowLeftLine aria-hidden />
            Projects
          </Link>
          <span className="task-breadcrumbs__sep" aria-hidden>
            /
          </span>
          <Link
            to={`/projects/${task.projectName}`}
            className="breadcrumb-link breadcrumb-link--muted"
          >
            Tasks
          </Link>
        </nav>

        <header className="task-detail-header">
          <p className="task-detail-id">Task ID · {task.id}</p>
          <h1 className="dashboard-title">{task.title}</h1>
          <p className="page-lede">{task.description}</p>
        </header>

        <div className="task-meta-strip card">
          <div className="task-meta-item">
            <RiUserLine aria-hidden />
            <div>
              <span className="task-meta-label">Assignee</span>
              <span className="task-meta-value">{task.assignedTo}</span>
            </div>
          </div>
          <div className="task-meta-item">
            <RiFlagLine aria-hidden />
            <div>
              <span className="task-meta-label">Priority</span>
              {isPM ? (
                <select
                  className={`input task-priority-select ${priorityBadgeClass}`}
                  value={String(effectivePriority).toLowerCase()}
                  onChange={(e) => setPriorityPm(e.target.value)}
                  aria-label="Task priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span className={`badge ${priorityBadgeClass}`}>
                  {priorityLabel}
                </span>
              )}
            </div>
          </div>
          <div className="task-meta-item">
            <RiCheckboxCircleLine aria-hidden />
            <div>
              <span className="task-meta-label">Status</span>
              <span className={`badge ${task.statusBadgeClass}`}>
                {task.statusLabel}
              </span>
            </div>
          </div>
          <div className="task-meta-item">
            <RiCalendarEventLine aria-hidden />
            <div>
              <span className="task-meta-label">Due</span>
              <span className="task-meta-value">{task.dueDate}</span>
            </div>
          </div>
        </div>

        <section className="card task-panel">
          <h3 className="task-panel-title">Attachments</h3>
          <div className="attachments-list">
            {files.length === 0 ? (
              <p className="empty-files">No attachments yet — upload relevant files.</p>
            ) : null}
            {files.map((file) => {
              const isImage = file.name.match(/\.(jpg|jpeg|png|gif)$/i)
              return (
                <div key={file.id} className="file-item">
                  {getFileIcon(file.name)}
                  <span className="file-name">{file.name}</span>
                  {isImage ? (
                    <button
                      type="button"
                      className="file-preview"
                      onClick={() => handlePreview(file.file)}
                    >
                      Preview
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="file-download"
                    onClick={() => downloadFile(file.file)}
                  >
                    <FiDownload /> Download
                  </button>
                  <button
                    type="button"
                    className="file-delete"
                    onClick={() => deleteFile(file.id)}
                  >
                    Delete
                  </button>
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

        <section className="card task-panel">
          <h3 className="task-panel-title">
            <FaRegCommentDots style={{ marginRight: "0.35rem", opacity: 0.85 }} />
            Comments
          </h3>
          <div className="comment-input">
            <textarea
              placeholder="Write an update for your team…"
              className="textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button type="button" className="btn btn-primary" onClick={addComment}>
              Post comment
            </button>
          </div>
          <button
            type="button"
            className="comment-toggle"
            onClick={() => setShowComments(!showComments)}
          >
            <FaRegCommentDots /> {comments.length}{" "}
            {showComments ? "Hide thread" : "Show thread"}
          </button>
          {showComments ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">{comment.user[0]}</div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-time">
                        {timeAgo(comment.time)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {previewImage ? (
        <div
          className="preview-modal"
          role="dialog"
          aria-modal
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="preview-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
