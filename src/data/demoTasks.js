/**
 * Fallback task details when opening /tasks/:id without navigation state
 * (e.g. refresh or direct URL). Keep in sync with ProjectDetails demo board.
 */
export const DEMO_TASKS_BY_ID = {
  t1: {
    id: "t1",
    title: "Design UI",
    description: "Create modern UI for dashboard and key flows.",
    status: "todo",
    priority: "high",
    assignedTo: "Ahmed",
    dueDate: "2026-04-12",
    projectId: "1",
    projectName: "Website Redesign",
  },
  t2: {
    id: "t2",
    title: "Build API",
    description: "Implement REST endpoints and validation for tasks and projects.",
    status: "progress",
    priority: "medium",
    assignedTo: "Sara",
    dueDate: "2026-04-18",
    projectId: "1",
    projectName: "Website Redesign",
  },
  t3: {
    id: "t3",
    title: "Setup Database",
    description: "Schema migrations, indexes, and seed data for development.",
    status: "done",
    priority: "low",
    assignedTo: "Omar",
    dueDate: "2026-03-28",
    projectId: "1",
    projectName: "Website Redesign",
  },
  t4: {
    id: "t4",
    title: "Create Login Page",
    description: "Wire login form to auth API and error states.",
    status: "todo",
    priority: "low",
    assignedTo: "Unassigned",
    dueDate: "2026-04-25",
    projectId: "1",
    projectName: "Website Redesign",
  },
}

export function getDemoTask(id) {
  if (!id) return null
  return DEMO_TASKS_BY_ID[String(id)] ?? null
}

/** Same tasks as the Project board initial state (single source of truth). */
export const INITIAL_KANBAN_TASKS = [
  DEMO_TASKS_BY_ID.t1,
  DEMO_TASKS_BY_ID.t2,
  DEMO_TASKS_BY_ID.t3,
  DEMO_TASKS_BY_ID.t4,
]
