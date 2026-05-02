import { useEffect, useState } from "react"
import Layout from "../layout/Layout"
import { useToast } from "../context/ToastContext"
import { getPendingPMRequests, approvePMRequest, rejectPMRequest } from "../services/userService"
import { getApiErrorParts } from "../utils/apiError"

export default function PendingUsers() {
  const { showToast } = useToast()
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const res = await getPendingPMRequests()
      const requests = res?.data?.data ?? res?.data ?? []
      setPendingRequests(requests)
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to load pending requests").title, "danger")
    } finally {
      setLoading(false)
    }
  }

  const updateRequest = async (userId, decision) => {
    try {
      if (decision === "accepted") {
        await approvePMRequest(userId)
        showToast("User promoted to Project Manager", "success")
      } else {
        await rejectPMRequest(userId)
        showToast("Request rejected", "info")
      }
      // Refresh list
      await fetchPendingRequests()
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to process request").title, "danger")
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">Loading pending requests...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-page-head">
          <div>
            <h1 className="dashboard-title">Pending Users</h1>
            <p className="page-lede">PM requests waiting for admin approval.</p>
          </div>
        </div>

        <div className="card admin-table-card">
          {pendingRequests.length === 0 ? (
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
                  {pendingRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name || request.fullName}</td>
                      <td>{request.email}</td>
                      <td>Project Manager</td>
                      <td className="admin-table-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => updateRequest(request.userId || request.id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => updateRequest(request.userId || request.id, "rejected")}
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