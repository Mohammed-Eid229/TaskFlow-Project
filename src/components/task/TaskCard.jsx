import { Draggable } from "react-beautiful-dnd"
import { useNavigate } from "react-router-dom"
import { RiCloseLine } from "react-icons/ri"

const PRIORITY_BORDER = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#34d399",
}

export default function TaskCard({ task, project, index, onDelete, canDelete = true }) {
  const navigate = useNavigate()
  const priority = (task.priority || "low").toLowerCase()
  const borderColor = PRIORITY_BORDER[priority] || PRIORITY_BORDER.low

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="kanban-task-card"
          style={{
            borderLeftColor: borderColor,
            ...provided.draggableProps.style,
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
                      projectName: project.name
                    }
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
        </div>
      )}
    </Draggable>
  )
}
