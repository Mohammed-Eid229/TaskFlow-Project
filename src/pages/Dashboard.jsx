import Layout from "../layout/Layout"
import { useAuth } from "../context/AuthContext"
import { isAdmin } from "../utils/roles"
import AdminDashboardView from "../components/admin/AdminDashboardView"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

export default function Dashboard() {
  const { user } = useAuth()

  if (isAdmin(user)) {
    return (
      <Layout>
        <AdminDashboardView />
      </Layout>
    )
  }

  const stats = {
    tasks: 12,
    completed: 7,
    projects: 3,
    pending: 2
  }

  const progressData = [
    { name: "To Do", value: 5 },
    { name: "In Progress", value: 4 },
    { name: "Done", value: 3 }
  ]

  const pieData = [
    { name: "Completed", value: 7 },
    { name: "Active", value: 3 },
    { name: "Pending", value: 2 }
  ]

  const workload = [
    { name: "Ahmed", completed: 30, remaining: 50, overdue: 20 },
    { name: "Mohamed", completed: 20, remaining: 60, overdue: 20 },
    { name: "Ali", completed: 25, remaining: 75, overdue: 0 }
  ]

  const COLORS = ["#6366f1", "#14b8a6", "#f59e0b"]

  return (
    <Layout>

      <div className="dashboard-container">

        <h1 className="dashboard-title">Project Overview</h1>
        <p className="page-lede">
          Track tasks, workload, and activity at a glance
        </p>

        {/* Stats */}
        <div className="stats">

          <div className="stat-card purple">
            <h2>{stats.tasks}</h2>
            <p>Total Tasks</p>
          </div>

          <div className="stat-card blue ">
            <h2>{stats.completed}</h2>
            <p>Completed</p>
          </div>

          <div className="stat-card green">
            <h2>{stats.projects}</h2>
            <p>Projects</p>
          </div>

          <div className="stat-card orange">
            <h2>{stats.pending}</h2>
            <p>Pending</p>
          </div>

        </div>

        {/* 🔥 Grid */}
        <div className="dashboard-grid">


          {/* Pie */}
          <div className="card large">
            <h3>Tasks Distribution</h3>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={90}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="legend">
              <div><span className="blue"></span> Completed</div>
              <div><span className="green"></span> Active</div>
              <div><span className="orange"></span> Pending</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card ">
            <h3>Tasks Progress</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>



          {/* Progress */}
          <div className="card">
            <h3>Project Progress</h3>

            {/* Planned */}
            <div className="progress-item">

              <span className="progress-title">Planned</span>

              <div className="progress-bar">
                <div
                  className="progress-fill planned"
                  style={{ width: "30%" }}
                >
                  30%
                </div>
              </div>

            </div>

            {/* Actual */}
            <div className="progress-item">

              <span className="progress-title">Actual</span>

              <div className="progress-bar">
                <div
                  className="progress-fill actual"
                  style={{ width: "65%" }}
                >
                  65%
                </div>
              </div>

            </div>

            {/* 🔥 Legend */}
            <div className="legend">
              <div><span className="planned-dot"></span> Planned</div>
              <div><span className="actual-dot"></span> Actual</div>
            </div>

          </div>

          {/* Workload */}
          <div className="card">
            <h3>Team Workload</h3>

            {workload.map((w, i) => (
              <div key={i} className="progress-line">
                <span>{w.name}</span>

                <div className="stack-bar">

                  <div
                    className="blue"
                    style={{ width: w.completed + "%" }}
                  ></div>

                  <div
                    className="green"
                    style={{ width: w.remaining + "%" }}
                  ></div>

                  <div
                    className="gray"
                    style={{ width: w.overdue + "%" }}
                  ></div>

                </div>
              </div>
            ))}
            <div className="legend">
              <div><span className="blue"></span> Completed</div>
              <div><span className="green"></span> Remaining</div>
              <div><span className="gray"></span> Overdue</div>
            </div>
          </div>


          {/* Activity */}
          <div className="card">
            <h3>Recent Activity</h3>

            <p>Ahmed completed "Design UI"</p>
            <p>Mohamed created new task</p>
            <p>You uploaded a file</p>
          </div>

        </div>

      </div>

    </Layout>
  )
}