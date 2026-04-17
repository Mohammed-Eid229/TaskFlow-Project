import Layout from "../layout/Layout"
import Column from "../components/task/Column"
import { DragDropContext } from "react-beautiful-dnd"
import { useState } from "react"
import { INITIAL_KANBAN_TASKS } from "../data/demoTasks"
import AddTaskModal from "../components/task/AddTaskModal"
import { Link, Navigate, useParams, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { canCreateProjectsAndTasks, isAdmin } from "../utils/roles"
import { RiArrowLeftLine, RiDragMoveLine } from "react-icons/ri"

export default function ProjectDetails() {

  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()

  const project = location.state?.project || {
    title: "Project",
    description: "No description"
  }
  const isPM = canCreateProjectsAndTasks(user)

  const [tasks, setTasks] = useState(INITIAL_KANBAN_TASKS)

  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isAdmin(user)) {
    return <Navigate to={`/admin/projects/${id}`} replace />
  }

  const todo = tasks.filter((t) => t.status === "todo")
  const progress = tasks.filter((t) => t.status === "progress")
  const done = tasks.filter((t) => t.status === "done")

  const onDragEnd = (result) => {
    if (!result.destination) return

    const taskId = result.draggableId
    const newStatus = result.destination.droppableId

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, status: newStatus }
      }
      return task
    })

    setTasks(updatedTasks)
  }

  const addTask = (title, priority) => {
    const assignee =
      user?.fullName?.trim() ||
      user?.email?.split("@")[0] ||
      "Unassigned"
    const newTask = {
      id: `t-${Date.now()}`,
      title,
      description: "",
      status: "todo",
      priority: priority || "medium",
      assignedTo: assignee,
      dueDate: "",
      projectId: "1",
      projectName: "Website Redesign",
    }
    setTasks([...tasks, newTask])
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }



  return (
    <Layout>
      <div className="project-detail-page">
        <Link to="/projects" className="breadcrumb-link">
          <RiArrowLeftLine aria-hidden />
          Back to projects
        </Link>

        <div className="project-header">
          <div>
            <h1 className="dashboard-title">{project.title}</h1>
            <p className="page-lede">{project.description}</p>
          </div>

          {isPM ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              + Add task
            </button>
          ) : (
            <p className="projects-role-hint">
              {/* Only <strong>project managers</strong> add tasks. Drag cards to
              update your progress. */}
            </p>
          )}
        </div>

        {!isPM ? (
          <div className="member-kanban-hint" role="status">
            <RiDragMoveLine aria-hidden />
            <span>
              Move tasks between columns to reflect your work — this updates
              status for the team.
            </span>
          </div>
        ) : null}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="card kanban-wrapper">
            <div className="board">
              <Column
                title="To Do"
                tasks={todo}
                project={project}
                id="todo"
                onDelete={deleteTask}
                canDeleteTask={isPM}
              />
              <Column
                title="In Progress"
                tasks={progress}
                project={project}
                id="progress"
                onDelete={deleteTask}
                canDeleteTask={isPM}
              />
              <Column
                title="Done"
                tasks={done}
                project={project}
                id="done"
                onDelete={deleteTask}
                canDeleteTask={isPM}
              />
            </div>
          </div>
        </DragDropContext>

        {isPM ? (
          <AddTaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={addTask}
          />
        ) : null}
      </div>
    </Layout>
  )
}
