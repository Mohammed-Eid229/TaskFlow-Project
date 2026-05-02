import Layout from "../layout/Layout"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { RiUserLine, RiMailLine, RiShieldUserLine, RiLockLine, RiPencilLine } from "react-icons/ri"
import { HiOutlinePhotograph } from "react-icons/hi"
import { uploadProfileImage, updateProfile as updateProfileApi, changePassword as changePasswordApi, getMyProfile } from "../services/userService"
import { getMyProjects } from "../services/projectService"
import { getMyTasks } from "../services/taskService"
import { Link } from "react-router-dom"

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ?? ""

function Avatar({ src, name, size = 112 }) {
  const initial = (name || "U").trim()[0].toUpperCase()
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    const fullSrc = src.startsWith("http") ? src : `${BASE_URL}${src}`
    return (
      <img 
        src={fullSrc} 
        alt={name} 
        className="profile-avatar-img"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)} 
      />
    )
  }

  return (
    <div className="profile-avatar-img" style={{
      width: size, height: size,
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, color: "#fff"
    }}>
      {initial}
    </div>
  )
}

function ProfileEditForms({ user, showToast, onClose, onProfileUpdated }) {
  const [nameEdit, setNameEdit] = useState(user?.fullName ?? "")
  const [emailEdit, setEmailEdit] = useState(user?.email ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!nameEdit.trim() || !emailEdit.trim()) { showToast("Name and email are required.", "error"); return }
    try {
      setSaving(true)
      await updateProfileApi({ fullName: nameEdit.trim(), email: emailEdit.trim() })
      showToast("Profile updated successfully.", "success")
      onProfileUpdated?.(); onClose?.()
    } catch { showToast("Failed to update profile.", "error") }
    finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters.", "error"); return }
    if (newPassword !== confirmPassword) { showToast("New passwords do not match.", "error"); return }
    try {
      setSaving(true)
      await changePasswordApi({ currentPassword, newPassword, confirmPassword })
      showToast("Password changed successfully.", "success")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
      onClose?.()
    } catch { showToast("Failed to change password.", "error") }
    finally { setSaving(false) }
  }

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <form onSubmit={handleSaveProfile}>
          <h4 className="mb-3">Edit profile</h4>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value={nameEdit} onChange={(e) => setNameEdit(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={emailEdit} onChange={(e) => setEmailEdit(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        </form>
      </div>
      
      <div className="col-md-6">
        <form onSubmit={handleChangePassword}>
          <h4 className="mb-3"><RiLockLine className="me-2" /> Change password</h4>
          <div className="mb-3">
            <label className="form-label">Current password</label>
            <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">New password</label>
            <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm new password</label>
            <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Change password"}</button>
        </form>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const [myProjects, setMyProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true)
        const profileRes = await getMyProfile()
        const profileData = profileRes?.data?.data ?? profileRes?.data ?? {}
        if (profileData.profileImageUrl) setProfileImageUrl(profileData.profileImageUrl)
        
        const projectsRes = await getMyProjects()
        const projects = Array.isArray(projectsRes?.data) ? projectsRes.data
          : Array.isArray(projectsRes?.data?.data) ? projectsRes.data.data
          : []
        setMyProjects(projects)
        
        const tasksRes = await getMyTasks()
        let tasks = Array.isArray(tasksRes?.data) ? tasksRes.data
          : Array.isArray(tasksRes?.data?.data) ? tasksRes.data.data
          : []
        
        const myTasksFiltered = tasks.filter(t => 
          t.assignedTo === user?.id || 
          t.assignedUserId === user?.id ||
          t.assignedUserName === user?.email
        )
        setMyTasks(myTasksFiltered)
        
      } catch (error) {
        console.error("Failed to load profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProfileData()
  }, [user?.id, user?.email])

  const displayName = user?.fullName || user?.name || user?.email || "User"
  const displayEmail = user?.email || "—"
  const displayRole = user?.displayRole || user?.role || "—"

  const roleKey = String(displayRole).toLowerCase().replace(/\s+/g, "")
  const isPM = displayRole === "Project Manager" || roleKey === "projectmanager"
  const isMember = displayRole === "Team Member" || roleKey === "teammember"
  const isAdminUser = displayRole === "Admin" || roleKey === "admin"

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      setProfileImageUrl(URL.createObjectURL(file))
      const res = await uploadProfileImage(file)
      const url = res?.data?.data ?? res?.data ?? ""
      if (url) { setProfileImageUrl(url); updateProfile({ profileImageUrl: url }) }
      showToast("Photo updated successfully.", "success")
    } catch { showToast("Failed to upload photo.", "error") }
    finally { setUploading(false) }
  }

  return (
    <Layout>
      <div className="profile-page">
        {/* Hero Section */}
        <div className="profile-hero">
          <div className="profile-hero__pattern" />
        </div>

        {/* Profile Sheet */}
        <div className="profile-sheet">
          {/* Profile Header */}
          <div className="profile-head">
            <div className="profile-avatar-block">
              <div className="profile-avatar-ring">
                <Avatar src={profileImageUrl} name={displayName} />
              </div>
              <label className="profile-photo-btn">
                <HiOutlinePhotograph size={14} />
                {uploading ? "Uploading..." : "Change photo"}
                <input type="file" accept="image/*" hidden onChange={handleImageChange} disabled={uploading} />
              </label>
            </div>
            <div className="profile-head-meta">
              <h1 className="profile-display-name">{displayName}</h1>
              <ul className="profile-facts">
                <li><RiMailLine /> {displayEmail}</li>
                <li><RiShieldUserLine /> <span className="profile-role-badge">{displayRole}</span></li>
              </ul>
            </div>
            <button className="btn btn-primary" onClick={() => setEditOpen(true)} style={{ alignSelf: "center" }}>
              <RiPencilLine /> Edit profile
            </button>
          </div>

          <div className="profile-divider" />

          {/* Profile Sections */}
          <div className="profile-sections">
            {isPM && (
              <section>
                <h2 className="profile-section-title">
                  <RiUserLine /> Your Projects
                </h2>
                {loading ? (
                  <p className="profile-section-text">Loading...</p>
                ) : myProjects.length > 0 ? (
                  <div className="row g-3">
                    {myProjects.map((project) => (
                      <div key={project.id} className="col-md-6 col-lg-4">
                        <Link to={`/projects/${project.id}`} state={{ project }} className="text-decoration-none">
                          <div className="profile-list-item">
                            <div>
                              <div className="profile-list-title">{project.name || project.title}</div>
                              <div className="profile-list-sub">
                                {project.description?.slice(0, 60) || "No description"}
                              </div>
                            </div>
                            <span className="profile-status-pill profile-status-pill--progress">
                              Active
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="profile-section-text">No projects assigned yet.</p>
                )}
              </section>
            )}

            {isMember && (
              <section>
                <h2 className="profile-section-title">
                  <RiUserLine /> Your Tasks ({myTasks.length})
                </h2>
                {loading ? (
                  <p className="profile-section-text">Loading...</p>
                ) : myTasks.length > 0 ? (
                  <div className="row g-3">
                    {myTasks.map((task) => (
                      <div key={task.id} className="col-md-6 col-lg-4">
                        <Link to={`/tasks/${task.id}`} state={{ task, projectId: task.projectId }} className="text-decoration-none">
                          <div className="profile-list-item">
                            <div>
                              <div className="profile-list-title">{task.title}</div>
                              <div className="profile-list-sub">
                                {task.description?.slice(0, 60) || "No description"}
                              </div>
                            </div>
                           <span className={`profile-status-pill ${
                            task.status === "done" ? "profile-status-pill--done" : "profile-status-pill--progress"
                          }`}>
                            {task.status === "done" ? "Completed" : "In Progress"}
                          </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="profile-section-text">No tasks assigned yet.</p>
                )}
              </section>
            )}

            {isAdminUser && (
              <section>
                <h2 className="profile-section-title">
                  <RiShieldUserLine /> Admin Dashboard
                </h2>
                <p className="profile-section-text">Manage users and PM approvals from the sidebar.</p>
              </section>
            )}

            {!isPM && !isMember && !isAdminUser && (
              <section>
                <h2 className="profile-section-title">Overview</h2>
                <p className="profile-section-text">Project and task summaries will appear here based on your role.</p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && user && (
        <div className="tf-dialog-root" role="presentation">
          <button type="button" className="tf-dialog-backdrop" onClick={() => setEditOpen(false)} />
          <div className="tf-dialog tf-dialog--profile-edit" role="dialog" aria-modal="true">
            <div className="profile-edit-modal-head">
              <h2 className="profile-edit-modal-title">Edit profile</h2>
              <button type="button" className="profile-edit-close" onClick={() => setEditOpen(false)}>×</button>
            </div>
            <ProfileEditForms
              user={user} showToast={showToast}
              onClose={() => setEditOpen(false)}
              onProfileUpdated={() => getMyProfile().then((res) => {
                const data = res?.data?.data ?? res?.data ?? {}
                if (data.profileImageUrl) setProfileImageUrl(data.profileImageUrl)
              }).catch(() => {})}
            />
          </div>
        </div>
      )}
    </Layout>
  )
}