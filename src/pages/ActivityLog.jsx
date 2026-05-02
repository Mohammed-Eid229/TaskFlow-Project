import { useEffect, useState } from "react"
import Layout from "../layout/Layout"
import { getActivityLog } from "../services/userService"
import { useToast } from "../context/ToastContext"
import { getApiErrorParts } from "../utils/apiError"
import {
  RiAddCircleLine,
  RiDeleteBinLine,
  RiShieldUserLine,
  RiInboxArchiveLine,
  RiMailSendLine,
} from "react-icons/ri"

const iconByType = {
  create: RiAddCircleLine,
  delete: RiDeleteBinLine,
  role: RiShieldUserLine,
  archive: RiInboxArchiveLine,
  invite: RiMailSendLine,
}

function formatActivityTime(dateString) {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${diffDays} days ago`
}

export default function ActivityLog() {
  const { showToast } = useToast()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await getActivityLog()
      const activitiesList = res?.data?.data ?? res?.data ?? []
      setActivities(activitiesList)
    } catch (error) {
      showToast(getApiErrorParts(error, "Failed to load activities").title, "danger")
    } finally {
      setLoading(false)
    }
  }

  const getIconForAction = (description) => {
    if (description?.toLowerCase().includes("create")) return "create"
    if (description?.toLowerCase().includes("delete")) return "delete"
    if (description?.toLowerCase().includes("role") || description?.toLowerCase().includes("promote")) return "role"
    if (description?.toLowerCase().includes("archive")) return "archive"
    if (description?.toLowerCase().includes("invite") || description?.toLowerCase().includes("assign")) return "invite"
    return "create"
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">Loading activities...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="admin-page activity-page">
        <h1 className="dashboard-title">Activity log</h1>
        <p className="page-lede">Recent actions across the workspace.</p>

        <div className="card activity-feed">
          {activities.length === 0 ? (
            <p className="text-muted text-center py-4">No activities yet.</p>
          ) : (
            <ul className="activity-feed-list">
              {activities.map((row, idx) => {
                const type = getIconForAction(row.description)
                const Icon = iconByType[type] ?? RiAddCircleLine
                return (
                  <li key={row.id || idx} className="activity-feed-item">
                    <span className={`activity-feed-icon activity-feed-icon--${type}`} aria-hidden>
                      <Icon />
                    </span>
                    <div className="activity-feed-body">
                      <p className="activity-feed-line">
                        {row.description || row.message || "Activity"}
                      </p>
                    </div>
                    <time className="activity-feed-time" dateTime={row.date} title={row.date}>
                      {formatActivityTime(row.date)}
                    </time>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}