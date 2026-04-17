import { Link, useParams } from "react-router-dom"
import Layout from "../layout/Layout"
import { initialMockAdminProjects } from "../data/adminMock"
import { RiArrowLeftLine, RiFolderLine, RiUserLine, RiListCheck } from "react-icons/ri"

export default function AdminProjectView() {
  const { id } = useParams()
  const project = initialMockAdminProjects.find(
    (p) => String(p.id) === String(id)
  )

  if (!project) {
    return (
      <Layout>
        <p className="page-lede">Project not found in mock data.</p>
        <Link to="/projects" className="breadcrumb-link">
          <RiArrowLeftLine aria-hidden />
          Back to projects
        </Link>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link to="/projects" className="breadcrumb-link">
        <RiArrowLeftLine aria-hidden />
        Back to projects
      </Link>

      <div className="admin-project-view">
        <h1 className="dashboard-title">{project.title}</h1>
        <p className="page-lede">{project.description}</p>

        <div className="admin-project-facts card">
          <div className="admin-project-fact">
            <RiUserLine aria-hidden />
            <div>
              <span className="admin-project-fact-label">Owner (PM)</span>
              <span className="admin-project-fact-value">{project.ownerName}</span>
            </div>
          </div>
          <div className="admin-project-fact">
            <RiListCheck aria-hidden />
            <div>
              <span className="admin-project-fact-label">Task count</span>
              <span className="admin-project-fact-value">{project.taskCount}</span>
            </div>
          </div>
          <div className="admin-project-fact">
            <RiFolderLine aria-hidden />
            <div>
              <span className="admin-project-fact-label">Project ID</span>
              <span className="admin-project-fact-value">{project.id}</span>
            </div>
          </div>
        </div>

        <p className="admin-readonly-note" role="status">
          Admins cannot open the Kanban board or task details. Connect this view
          to <code>GET /api/projects/:id</code> when the backend is ready.
        </p>
      </div>
    </Layout>
  )
}
