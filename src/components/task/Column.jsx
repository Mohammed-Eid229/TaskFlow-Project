import TaskCard from "./TaskCard"

export default function Column({
  title,
  tasks,
  project,
  id,
  onDelete,
  canDeleteTask = true,
  canDragTask = true,
}) {
  return (
    <div className="column">
      <h3>{title}</h3>

      {tasks.length === 0 ? (
        <div className="column-empty">
          <p className="text-muted">No tasks</p>
        </div>
      ) : (
        tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            project={project}
            index={index}
            onDelete={onDelete}
            canDelete={canDeleteTask}
            canDrag={canDragTask}
          />
        ))
      )}
    </div>
  )
}