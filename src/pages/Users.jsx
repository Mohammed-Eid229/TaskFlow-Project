import { useEffect, useMemo, useState } from "react"
import Layout from "../layout/Layout"
import ConfirmDialog from "../components/admin/ConfirmDialog"
import { useToast } from "../context/ToastContext"
import { ROLE_OPTIONS, apiRoleFromValue } from "../data/adminMock"
import { getAdminUsers, saveAdminUsers } from "../data/adminStore"
import { RiSearchLine } from "react-icons/ri"

const PAGE_SIZE = 5

export default function Users() {
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    setUsers(getAdminUsers())
  }, [])

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
    const nextUsers = users.map((u) => (u.id === id ? { ...u, role: value } : u))
    setUsers(nextUsers)
    saveAdminUsers(nextUsers)
    showToast("Role updated (mock — connect PATCH /api/users/:id)", "success")
  }

  const confirmDelete = () => {
    if (deleteId == null) return
    const nextUsers = users.filter((u) => u.id !== deleteId)
    setUsers(nextUsers)
    saveAdminUsers(nextUsers)
    setDeleteId(null)
    showToast("User removed (mock)", "success")
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
