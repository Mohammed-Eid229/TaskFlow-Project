import { Droppable } from "react-beautiful-dnd"
import TaskCard from "./TaskCard"

export default function Column({
  title,
  tasks,
  project,
  id,
  onDelete,
  canDeleteTask = true,
}) {
  return (
    <Droppable droppableId={id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="column"
        >
          <h3>{title}</h3>

          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              project={project}
              index={index}
              onDelete={onDelete}
              canDelete={canDeleteTask}
            />
          ))}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
