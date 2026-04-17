import Layout from "../layout/Layout"
import { initialActivityLog, formatActivityTime } from "../data/adminMock"
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

export default function ActivityLog() {
  return (
    <Layout>
      <div className="admin-page activity-page">
        <h1 className="dashboard-title">Activity log</h1>
        <p className="page-lede">
          Recent actions across the workspace — replace with{" "}
          <code>GET /api/activity</code> when ready.
        </p>

        <div className="card activity-feed">
          <ul className="activity-feed-list">
            {initialActivityLog.map((row) => {
              const type = row.type ?? "create"
              const Icon = iconByType[type] ?? RiAddCircleLine
              return (
                <li key={row.id} className="activity-feed-item">
                  <span
                    className={`activity-feed-icon activity-feed-icon--${type}`}
                    aria-hidden
                  >
                    <Icon />
                  </span>
                  <div className="activity-feed-body">
                    <p className="activity-feed-line">
                      <strong>{row.user}</strong> {row.action}{" "}
                      <span className="activity-feed-target">{row.target}</span>
                    </p>
                  </div>
                  <time
                    className="activity-feed-time"
                    dateTime={row.time}
                    title={row.time}
                  >
                    {formatActivityTime(row.time)}
                  </time>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Layout>
  )
}
