const PROJECTS_KEY = "tf_projects"

const seededProjects = [
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
]

function readProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function getProjects() {
  const projects = readProjects() || seededProjects
  if (!readProjects()) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  }
  return projects
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function deleteProjectById(projectId) {
  const projects = getProjects()
  const next = projects.filter((project) => String(project.id) !== String(projectId))
  saveProjects(next)
  return next
}
