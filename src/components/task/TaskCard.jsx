import { useNavigate } from "react-router-dom"
import { RiCloseLine, RiUserLine, RiCalendarEventLine } from "react-icons/ri"

const PRIORITY_BORDER = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#34d399",
}

export default function TaskCard({
  task,
  project,
  index,
  onDelete,
  canDelete = true,
  canDrag = true,
}) {
  const navigate = useNavigate()
  const priority = (task.priority || "low").toLowerCase()
  const borderColor = PRIORITY_BORDER[priority] || PRIORITY_BORDER.low

  return (
    <div
      className="kanban-task-card"
      style={{
        borderLeftColor: borderColor,
      }}
    >
      <div className="kanban-task-card__row">
        <button
          type="button"
          className="kanban-task-card__title"
          onClick={() =>
            navigate(`/tasks/${task.id}`, {
              state: {
                task: {
                  ...task,
                  projectId: project.id,
                  projectName: project.name ?? project.title
                },
                projectId: project.id
              }
            })
          }
        >
          {task.title}
        </button>
        {canDelete ? (
          <button
            type="button"
            className="kanban-task-card__delete"
            aria-label="Remove task"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
          >
            <RiCloseLine />
          </button>
        ) : null}
      </div>
      {(task.assignedTo && task.assignedTo !== "Unassigned") || task.dueDate ? (
        <div className="kanban-task-card__footer">
          {task.assignedTo && task.assignedTo !== "Unassigned" && (
            <div className="kanban-task-card__assignee">
              <RiUserLine size={12} />
              <span>{task.assignedTo}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="kanban-task-card__due">
              <RiCalendarEventLine size={12} />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}