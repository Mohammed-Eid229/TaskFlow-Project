import { useMemo, useState } from "react"
import Layout from "../layout/Layout"
import ConfirmDialog from "../components/admin/ConfirmDialog"
import { useToast } from "../context/ToastContext"
import {
  initialMockUsers,
  ROLE_OPTIONS,
  nextMockUserId,
  apiRoleFromValue,
} from "../data/adminMock"
import { RiUserAddLine, RiSearchLine } from "react-icons/ri"

const PAGE_SIZE = 5

export default function Users() {
  const { showToast } = useToast()
  const [users, setUsers] = useState(initialMockUsers)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [deleteId, setDeleteId] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const sliceStart = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(sliceStart, sliceStart + PAGE_SIZE)

  const handleRoleChange = (id, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: value } : u))
    )
    showToast("Role updated (mock — connect PATCH /api/users/:id)", "success")
  }

  const confirmDelete = () => {
    if (deleteId == null) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteId))
    setDeleteId(null)
    showToast("User removed (mock)", "success")
  }

  const addUser = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) {
      showToast("Name and email are required.", "error")
      return
    }
    const row = {
      id: nextMockUserId(),
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
    }
    setUsers((prev) => [...prev, row])
    setAddOpen(false)
    setNewName("")
    setNewEmail("")
    setNewRole("user")
    showToast("User added (mock — connect POST /api/users)", "success")
  }

  const toDeleteName = users.find((u) => u.id === deleteId)?.name

  return (
    <Layout>
      <div className="admin-page users-page">
        <div className="admin-page-head">
          <div>
            <h1 className="dashboard-title">Users</h1>
            <p className="page-lede">
              Manage accounts and roles — UI only until the API is wired.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <RiUserAddLine aria-hidden /> Add user
          </button>
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
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
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
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="input admin-select admin-select--inline"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        aria-label={`Role for ${u.name}`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <span className="admin-api-hint" title="Maps to API role">
                        API: {apiRoleFromValue(u.role)}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteId(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <p className="admin-empty">No users match your filters.</p>
          ) : null}

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

      {addOpen ? (
        <div className="tf-dialog-root" role="presentation">
          <button
            type="button"
            className="tf-dialog-backdrop"
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <div className="tf-dialog" role="dialog" aria-modal="true">
            <h2 className="tf-dialog-title">Add user</h2>
            <form className="admin-form" onSubmit={addUser}>
              <label className="auth-label">
                Full name
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </label>
              <label className="auth-label">
                Email
                <input
                  className="input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </label>
              <label className="auth-label">
                Role
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="tf-dialog-actions tf-dialog-actions--form">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteId != null}
        title="Delete user?"
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      >
        {toDeleteName ? (
          <p>
            Remove <strong>{toDeleteName}</strong>? This cannot be undone when
            the API is connected.
          </p>
        ) : null}
      </ConfirmDialog>
    </Layout>
  )
}
