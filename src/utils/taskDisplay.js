/** Kanban column ids → user-facing labels */
const STATUS_LABEL = {
  todo: "To Do",
  progress: "In Progress",
  done: "Done",
}

export function kanbanStatusToLabel(status) {
  if (!status) return "—"
  const key = String(status).toLowerCase().trim()
  if (STATUS_LABEL[key]) return STATUS_LABEL[key]
  return String(status)
}

export function formatPriorityLabel(priority) {
  if (!priority) return "—"
  const s = String(priority).toLowerCase()
  if (s === "high" || s === "medium" || s === "low") {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  return String(priority)
}

export function priorityToBadgeClass(priority) {
  const s = String(priority || "low").toLowerCase()
  if (s === "high") return "priority-high"
  if (s === "medium") return "priority-medium"
  return "priority-low"
}

export function statusToBadgeClass(status) {
  const key = String(status || "todo").toLowerCase().trim()
  if (key === "progress") return "status-inprogress"
  if (key === "done") return "status-done"
  return "status-todo"
}

const DEFAULT_PROJECT = {
  projectId: "1",
  projectName: "Website Redesign",
}

/**
 * Normalizes any task shape (API, kanban state, or demo seed) for the detail page.
 */
export function normalizeTaskDetail(raw, idFromRoute) {
  const id = String(raw?.id ?? idFromRoute ?? "")
  const status = raw?.status ?? "todo"
  const priority = raw?.priority ?? "medium"

  return {
    id,
    title: raw?.title?.trim() || "Untitled task",
    description:
      (raw?.description && String(raw.description).trim()) ||
      "No description yet. Add details when the API is connected.",
    status,
    statusLabel: kanbanStatusToLabel(status),
    priority,
    priorityLabel: formatPriorityLabel(priority),
    priorityBadgeClass: priorityToBadgeClass(priority),
    statusBadgeClass: statusToBadgeClass(status),
    assignedTo: raw?.assignedTo?.trim() || "Unassigned",
    dueDate: raw?.dueDate?.trim() || "—",
    projectId: String(raw?.projectId ?? DEFAULT_PROJECT.projectId),
    projectName: raw?.projectName ?? DEFAULT_PROJECT.projectName,
  }
}
