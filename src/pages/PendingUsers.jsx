import { useMemo, useState } from "react"
import Layout from "../layout/Layout"
import { useToast } from "../context/ToastContext"
import {
  getAdminUsers,
  getPendingPmRequests,
  saveAdminUsers,
  savePendingPmRequests,
} from "../data/adminStore"

export default function PendingUsers() {
  const { showToast } = useToast()
  const [pendingRequests, setPendingRequests] = useState(getPendingPmRequests)
  const [users, setUsers] = useState(getAdminUsers)

  const pendingOnly = useMemo(
    () => pendingRequests.filter((request) => request.status === "pending"),
    [pendingRequests]
  )

  const updateRequest = (requestId, decision) => {
    const target = pendingRequests.find((request) => request.id === requestId)
    if (!target) return

    const nextRequests = pendingRequests.map((request) =>
      request.id === requestId ? { ...request, status: decision } : request
    )
    setPendingRequests(nextRequests)
    savePendingPmRequests(nextRequests)

    if (decision === "accepted") {
      const nextUsers = users.map((user) =>
        user.id === target.userId ? { ...user, role: "pm" } : user
      )
      setUsers(nextUsers)
      saveAdminUsers(nextUsers)
      showToast(`${target.name} promoted to Project Manager.`, "success")
      return
    }

    showToast(`${target.name} stays as normal user.`, "info")
  }

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-page-head">
          <div>
            <h1 className="dashboard-title">Pending Users</h1>
            <p className="page-lede">
              PM requests waiting for admin approval.
            </p>
          </div>
        </div>

        <div className="card admin-table-card">
          {pendingOnly.length === 0 ? (
            <p className="admin-empty">No pending PM requests.</p>
          ) : (
            <div className="table-scroll">
              <table className="admin-table table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Requested role</th>
                    <th aria-label="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOnly.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name}</td>
                      <td>{request.email}</td>
                      <td>Project Manager</td>
                      <td className="admin-table-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => updateRequest(request.id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => updateRequest(request.id, "rejected")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
