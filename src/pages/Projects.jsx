import Layout from "../layout/Layout"
import { Link } from "react-router-dom"
import { useState } from "react"
import CreateProjectModal from "../components/project/CreateProjectModal"
import { useAuth } from "../context/AuthContext"
import { canCreateProjectsAndTasks, isAdmin } from "../utils/roles"
import { RiFolderLine, RiTeamLine, RiArrowRightLine } from "react-icons/ri"
import AdminProjects from "./AdminProjects"

export default function Projects() {
  const { user } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Website Redesign",
      description: "Redesign company website",
      members: 5,
      tasksOpen: 8,
    },
    {
      id: 2,
      title: "Mobile App",
      description: "Build mobile application",
      members: 4,
      tasksOpen: 12,
    },
    {
      id: 3,
      title: "Admin Dashboard",
      description: "Create admin panel",
      members: 3,
      tasksOpen: 5,
    },
    {
      id: 4,
      title: "API Integration",
      description: "Connect services and webhooks",
      members: 6,
      tasksOpen: 4,
    },
    {
      id: 5,
      title: "Design System",
      description: "Tokens, components, documentation",
      members: 2,
      tasksOpen: 6,
    },
    {
      id: 6,
      title: "QA Sprint",
      description: "Regression and release testing",
      members: 4,
      tasksOpen: 9,
    },
  ])

  if (isAdmin(user)) {
    return <AdminProjects />
  }

  const canCreate = canCreateProjectsAndTasks(user)

  const createProject = (title, description) => {
    const newProject = {
      id: Date.now(),
      title,
      description,
      members: 1,
      tasksOpen: 0,
    }
    setProjects([...projects, newProject])
  }

  return (
    <Layout>
      <div className="projects-page">
        <div className="project-header">
          <div>
            <h1 className="dashboard-title">Projects</h1>
            <p className="page-lede">
              Open a project to view the board and tasks
            </p>
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              + Create project
            </button>
          ) : (
            <p className="projects-role-hint" title="Course role rules">
              {/* Only <strong>project managers</strong> can create projects. */}
            </p>
          )}
        </div>

        <div className="responsive-grid projects-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              state={{ project }}
              className="project-tile"
            >
              <article className="card project-card-elevated">
                <div className="project-card-top">
                  <span className="project-card-icon" aria-hidden>
                    <RiFolderLine />
                  </span>
                  <RiArrowRightLine className="project-card-arrow" aria-hidden />
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-card-meta">
                  <span>
                    <RiTeamLine aria-hidden />
                    {project.members} members
                  </span>
                  <span>{project.tasksOpen} open tasks</span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={createProject}
        />
      </div>
    </Layout>
  )
}
