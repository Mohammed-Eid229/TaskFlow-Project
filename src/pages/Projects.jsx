import Layout from "../layout/Layout"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import CreateProjectModal from "../components/project/CreateProjectModal"
import { useAuth } from "../context/AuthContext"
import { canCreateProjectsAndTasks, isAdmin } from "../utils/roles"
import { RiFolderLine, RiTeamLine, RiArrowRightLine } from "react-icons/ri"
import AdminProjects from "./AdminProjects"
import { getProjects, saveProjects } from "../data/projectsStore"

export default function Projects() {
  const { user } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [projects, setProjects] = useState([])

  useEffect(() => {
    setProjects(getProjects())
  }, [])

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
    const nextProjects = [...projects, newProject]
    setProjects(nextProjects)
    saveProjects(nextProjects)
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

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="col">
              <Link
                to={`/projects/${project.id}`}
                state={{ project }}
                className="project-tile text-decoration-none"
              >
                <article className="card project-card-elevated h-100">
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
            </div>
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
