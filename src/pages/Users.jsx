import { useEffect, useMemo, useState } from "react"
import Layout from "../layout/Layout"
import ConfirmDialog from "../components/admin/ConfirmDialog"
import { useToast } from "../context/ToastContext"
import { getAllUsersForAdmin, updateUserRole, deleteUser } from "../services/userService"
import { getApiErrorParts } from "../utils/apiError"
import { RiSearchLine, RiShieldUserLine, RiDeleteBinLine } from "react-icons/ri"

const PAGE_SIZE = 5

// تحويل role من API للعرض
const formatRole = (role) => {
  const r = String(role || "").toLowerCase().replace(/[\s_]/g, "")
  if (r === "teammember" || r === "member") return "team_member"
  if (r === "projectmanager" || r === "projectmanager") return "project_manager"
  if (r === "admin") return "admin"
  return role || "user"
}

// تحويل role للعرض الجميل
const getRoleLabel = (role) => {
  const formatted = formatRole(role)
  if (formatted === "team_member") return "Team Member"
  if (formatted === "project_manager") return "Project Manager"
  if (formatted === "admin") return "Admin"
  return "User"
}

export default function Users() {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const [changeRoleId, setChangeRoleId] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getAllUsersForAdmin()
      const usersList = res?.data?.data ?? res?.data ?? []
      setUsers(usersList)
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to load users").title, "danger")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && formatRole(u.role) !== roleFilter) return false
      if (!q) return true
      return (
        (u.name || u.fullName || "").toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const sliceStart = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(sliceStart, sliceStart + PAGE_SIZE)

  const handleRoleChange = async () => {
    if (!changeRoleId) return
    try {
      let apiRole = ""
      if (selectedRole === "team_member") apiRole = "team member"
      else if (selectedRole === "project_manager") apiRole = "project manager"
      else apiRole = "user"
      
      await updateUserRole(changeRoleId, apiRole)
      setUsers(prev => prev.map(u => 
        u.id === changeRoleId ? { ...u, role: selectedRole } : u
      ))
      showToast("Role updated successfully", "success")
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to update role").title, "danger")
    } finally {
      setChangeRoleId(null)
      setSelectedRole("")
    }
  }

  const confirmDelete = async () => {
    if (deleteId == null) return
    try {
      await deleteUser(deleteId)
      setUsers(prev => prev.filter(u => u.id !== deleteId))
      showToast("User deleted successfully", "success")
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to delete user").title, "danger")
    }
    setDeleteId(null)
  }

  const openChangeRoleModal = (user) => {
    const currentRole = formatRole(user.role)
    setSelectedRole(currentRole === "team_member" ? "team_member" : 
                    currentRole === "project_manager" ? "project_manager" : "user")
    setChangeRoleId(user.id)
  }

  const toDeleteName = users.find((u) => u.id === deleteId)?.name || users.find((u) => u.id === deleteId)?.fullName
  const toChangeName = users.find((u) => u.id === changeRoleId)?.name || users.find((u) => u.id === changeRoleId)?.fullName

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">Loading users...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="admin-page users-page">
        <div className="admin-page-head">
          <div>
            <h1 className="dashboard-title">Users</h1>
            <p className="page-lede">Manage accounts and roles.</p>
          </div>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search">
            <RiSearchLine aria-hidden />
            <input
              type="search"
              className="input admin-search-input"
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <label className="admin-filter-label">
            Role
            <select
              className="input admin-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All roles</option>
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name || u.fullName || u.email}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        formatRole(u.role) === "admin" ? "bg-danger" :
                        formatRole(u.role) === "project_manager" ? "bg-primary" :
                        "bg-secondary"
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => openChangeRoleModal(u)}
                      >
                        <RiShieldUserLine aria-hidden /> Change Role
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteId(u.id)}
                      >
                        <RiDeleteBinLine aria-hidden /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && <p className="admin-empty">No users match your filters.</p>}

          <div className="admin-pagination">
            <span className="admin-pagination-meta">
              Page {safePage} of {totalPages} · {filtered.length} users
            </span>
            <div className="admin-pagination-btns">
              <button
                type="button"
                className="btn btn-gray"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-gray"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteId != null}
        title="Delete user?"
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      >
        {toDeleteName ? (
          <p>Remove <strong>{toDeleteName}</strong>? This action cannot be undone.</p>
        ) : null}
      </ConfirmDialog>

      {/* Change Role Dialog */}
      <ConfirmDialog
        open={changeRoleId != null}
        title="Change User Role"
        danger={false}
        confirmLabel="Save"
        onCancel={() => {
          setChangeRoleId(null)
          setSelectedRole("")
        }}
        onConfirm={handleRoleChange}
      >
        {toChangeName ? (
          <div>
            <p>Change role for <strong>{toChangeName}</strong>:</p>
            <select 
              className="form-select mt-3"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #ddd" }}
            >
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
            </select>
          </div>
        ) : null}
      </ConfirmDialog>
    </Layout>
  )
}