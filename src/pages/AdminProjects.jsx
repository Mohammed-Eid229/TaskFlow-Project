import { useState } from "react"
import { Link } from "react-router-dom"
import Layout from "../layout/Layout"
import ConfirmDialog from "../components/admin/ConfirmDialog"
import { useToast } from "../context/ToastContext"
import { initialMockAdminProjects } from "../data/adminMock"
import { RiFolderLine, RiEyeLine, RiDeleteBinLine } from "react-icons/ri"

export default function AdminProjects() {
  const { showToast } = useToast()
  const [projects, setProjects] = useState(initialMockAdminProjects)
  const [pendingDelete, setPendingDelete] = useState(null)

  const title = projects.find((p) => p.id === pendingDelete)?.title

  const handleDelete = () => {
    if (pendingDelete == null) return
    setProjects((prev) => prev.filter((p) => p.id !== pendingDelete))
    setPendingDelete(null)
    showToast("Project deleted (mock — connect DELETE /api/projects/:id)", "success")
  }

  return (
    <Layout>
      <div className="admin-page">
        <h1 className="dashboard-title">Projects</h1>
        <p className="page-lede">
          All projects (read-only for admins — no Kanban or task editing).
        </p>

        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Owner (PM)</th>
                  <th>Tasks</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="admin-project-title">
                        <RiFolderLine aria-hidden />
                        {p.title}
                      </span>
                      <span className="admin-project-desc">{p.description}</span>
                    </td>
                    <td>{p.ownerName}</td>
                    <td>{p.taskCount}</td>
                    <td className="admin-table-actions admin-table-actions--row">
                      <Link
                        to={`/admin/projects/${p.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        <RiEyeLine aria-hidden /> View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setPendingDelete(p.id)}
                      >
                        <RiDeleteBinLine aria-hidden /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.length === 0 ? (
            <p className="admin-empty">No projects in the mock list.</p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        title="Delete project?"
        danger
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      >
        {title ? (
          <p>
            Remove <strong>{title}</strong>? Team boards will be unavailable for
            this project after deletion.
          </p>
        ) : null}
      </ConfirmDialog>
    </Layout>
  )
}
