import Layout from "../layout/Layout"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
  RiUserLine,
  RiMailLine,
  RiShieldUserLine,
  RiLockLine,
  RiPencilLine,
} from "react-icons/ri"
import { HiOutlinePhotograph } from "react-icons/hi"

function ProfileEditForms({ user, updateProfile, showToast, onClose }) {
  const [nameEdit, setNameEdit] = useState(user?.fullName ?? "")
  const [emailEdit, setEmailEdit] = useState(user?.email ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSaveProfile = (e) => {
    e.preventDefault()
    if (!nameEdit.trim() || !emailEdit.trim()) {
      showToast("Name and email are required.", "error")
      return
    }
    updateProfile({ fullName: nameEdit.trim(), email: emailEdit.trim() })
    showToast("Profile saved. Replace with PATCH /api/users/me when ready.")
    onClose?.()
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error")
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    showToast(
      "Password change recorded (mock — connect your auth API).",
      "success"
    )
    onClose?.()
  }

  return (
    <div className="profile-account-grid profile-account-grid--modal">
      <form className="admin-form" onSubmit={handleSaveProfile}>
        <h4 className="section-title" style={{ marginTop: 0 }}>
          Edit profile
        </h4>
        <label className="auth-label" htmlFor="profile-name">
          Name
        </label>
        <input
          id="profile-name"
          className="input"
          value={nameEdit}
          onChange={(e) => setNameEdit(e.target.value)}
          autoComplete="name"
        />
        <label className="auth-label" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          className="input"
          value={emailEdit}
          onChange={(e) => setEmailEdit(e.target.value)}
          autoComplete="email"
        />
        <div className="profile-form-actions">
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>
        </div>
      </form>

      <form className="admin-form" onSubmit={handleChangePassword}>
        <h4 className="section-title" style={{ marginTop: 0 }}>
          <RiLockLine aria-hidden /> Change password
        </h4>
        <label className="auth-label" htmlFor="profile-cur-pw">
          Current password
        </label>
        <input
          id="profile-cur-pw"
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <label className="auth-label" htmlFor="profile-new-pw">
          New password
        </label>
        <input
          id="profile-new-pw"
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <label className="auth-label" htmlFor="profile-confirm-pw">
          Confirm new password
        </label>
        <input
          id="profile-confirm-pw"
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <div className="profile-form-actions">
          <button type="submit" className="btn btn-primary">
            Update password
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [image, setImage] = useState("https://i.pravatar.cc/151")
  const [editOpen, setEditOpen] = useState(false)

  const displayName = user?.fullName || user?.email || "User"
  const displayEmail = user?.email || "—"
  const displayRole = user?.displayRole || user?.role || "—"

  const accountKey = `${user?.email ?? ""}-${user?.fullName ?? ""}`

  const projects = [
    { id: 1, title: "TaskFlow App", members: 5 },
    { id: 2, title: "E-commerce", members: 3 },
  ]

  const tasks = [
    { id: 1, title: "Fix Bug", status: "In Progress" },
    { id: 2, title: "Design UI", status: "Done" },
  ]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setImage(imageUrl)
    }
  }

  const roleKey = String(displayRole).toLowerCase().replace(/\s+/g, "")
  const isPM =
    displayRole === "Project Manager" || roleKey === "projectmanager"
  const isMember =
    displayRole === "Team Member" || roleKey === "teammember"
  const isAdmin = displayRole === "Admin" || roleKey === "admin"

  const closeEdit = () => setEditOpen(false)

  return (
    <Layout>
      <h1 className="dashboard-title">Profile</h1>
      <p className="page-lede">Your account and role-specific activity</p>

      <div className="profile-page">
        <div className="profile-hero" aria-hidden>
          <div className="profile-hero__pattern" />
        </div>

        <div className="profile-sheet">
          <header className="profile-head">
            <div className="profile-avatar-block">
              <div className="profile-avatar-ring">
                <img src={image} alt="" className="profile-avatar-img" />
              </div>
              <label className="profile-photo-btn">
                <HiOutlinePhotograph aria-hidden />
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="profile-head-meta">
              <h2 className="profile-display-name">{displayName}</h2>
              <ul className="profile-facts">
                <li>
                  <RiMailLine aria-hidden />
                  <span>{displayEmail}</span>
                </li>
                <li>
                  <RiShieldUserLine aria-hidden />
                  <span className="profile-role-badge">{displayRole}</span>
                </li>
              </ul>
              <div className="profile-head-actions">
                <button
                  type="button"
                  className="btn btn-primary profile-edit-trigger"
                  onClick={() => setEditOpen(true)}
                >
                  <RiPencilLine aria-hidden />
                  Edit profile
                </button>
              </div>
            </div>
          </header>

          <div className="profile-divider" />

          <div className="profile-sections">
            {isPM && (
              <section className="profile-section">
                <h3 className="profile-section-title">
                  <RiUserLine aria-hidden />
                  Your projects
                </h3>
                <ul className="profile-list">
                  {projects.map((p) => (
                    <li key={p.id} className="profile-list-item">
                      <div>
                        <span className="profile-list-title">{p.title}</span>
                        <span className="profile-list-sub">
                          {p.members} members
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isMember && (
              <section className="profile-section">
                <h3 className="profile-section-title">
                  <RiUserLine aria-hidden />
                  Your tasks
                </h3>
                <ul className="profile-list">
                  {tasks.map((t) => (
                    <li key={t.id} className="profile-list-item">
                      <span className="profile-list-title">{t.title}</span>
                      <span
                        className={`profile-status-pill profile-status-pill--${t.status === "Done" ? "done" : "progress"}`}
                      >
                        {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isAdmin && (
              <section className="profile-section">
                <h3 className="profile-section-title">
                  <RiShieldUserLine aria-hidden />
                  Admin
                </h3>
                <p className="profile-section-text">
                  Manage users and PM approvals — connect this section to your API
                  when ready.
                </p>
              </section>
            )}

            {!isPM && !isMember && !isAdmin && (
              <section className="profile-section">
                <h3 className="profile-section-title">Overview</h3>
                <p className="profile-section-text">
                  Project and task summaries will appear here based on your role.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {editOpen && user ? (
        <div className="tf-dialog-root" role="presentation">
          <button
            type="button"
            className="tf-dialog-backdrop"
            aria-label="Close dialog"
            onClick={closeEdit}
          />
          <div
            className="tf-dialog tf-dialog--profile-edit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
          >
            <div className="profile-edit-modal-head">
              <h2 id="profile-edit-title" className="profile-edit-modal-title">
                Edit profile
              </h2>
              <button
                type="button"
                className="profile-edit-close"
                onClick={closeEdit}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <ProfileEditForms
              key={accountKey}
              user={user}
              updateProfile={updateProfile}
              showToast={showToast}
              onClose={closeEdit}
            />
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
