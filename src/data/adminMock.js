
export const adminStats = {
  users: 25,
  projects: 8,
  tasks: 120,
  activeUsers: 10,
}

export const adminStatsTrend = [
  { label: "Mon", users: 18, tasks: 90 },
  { label: "Tue", users: 20, tasks: 95 },
  { label: "Wed", users: 22, tasks: 102 },
  { label: "Thu", users: 23, tasks: 110 },
  { label: "Fri", users: 24, tasks: 115 },
  { label: "Sat", users: 25, tasks: 118 },
  { label: "Sun", users: 25, tasks: 120 },
]

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", apiRole: "Admin" },
  { value: "pm", label: "PM", apiRole: "ProjectManager" },
  { value: "user", label: "User", apiRole: "TeamMember" },
]

export function roleLabelFromValue(value) {
  return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value
}

export function apiRoleFromValue(value) {
  return ROLE_OPTIONS.find((r) => r.value === value)?.apiRole ?? "TeamMember"
}

let _userId = 10
export function nextMockUserId() {
  _userId += 1
  return _userId
}

export const initialMockUsers = [
  {
    id: 1,
    name: "Ahmed Ali",
    email: "ahmed@taskflow.dev",
    role: "admin",
  },
  {
    id: 2,
    name: "Sara Hassan",
    email: "sara@taskflow.dev",
    role: "pm",
  },
  {
    id: 3,
    name: "Omar Khaled",
    email: "omar@taskflow.dev",
    role: "user",
  },
  {
    id: 4,
    name: "Mona Ibrahim",
    email: "mona@taskflow.dev",
    role: "pm",
  },
  {
    id: 5,
    name: "Youssef Nabil",
    email: "youssef@taskflow.dev",
    role: "user",
  },
  {
    id: 6,
    name: "Layla Farid",
    email: "layla@taskflow.dev",
    role: "user",
  },
  {
    id: 7,
    name: "Karim Adel",
    email: "karim@taskflow.dev",
    role: "pm",
  },
  {
    id: 8,
    name: "Nour Hany",
    email: "nour@taskflow.dev",
    role: "user",
  },
]

export const initialMockAdminProjects = [
  {
    id: 1,
    title: "Website Redesign",
    description: "Redesign company website",
    ownerName: "Sara Hassan",
    taskCount: 14,
  },
  {
    id: 2,
    title: "Mobile App",
    description: "Build mobile application",
    ownerName: "Mona Ibrahim",
    taskCount: 22,
  },
  {
    id: 3,
    title: "Admin Dashboard",
    description: "Create admin panel",
    ownerName: "Sara Hassan",
    taskCount: 9,
  },
  {
    id: 4,
    title: "API Integration",
    description: "Connect services and webhooks",
    ownerName: "Karim Adel",
    taskCount: 11,
  },
  {
    id: 5,
    title: "Design System",
    description: "Tokens, components, documentation",
    ownerName: "Mona Ibrahim",
    taskCount: 7,
  },
  {
    id: 6,
    title: "QA Sprint",
    description: "Regression and release testing",
    ownerName: "Karim Adel",
    taskCount: 18,
  },
]

export const initialActivityLog = [
  {
    id: "a1",
    type: "create",
    user: "Ahmed",
    action: "created project",
    target: "Design System",
    time: "2026-04-14T09:12:00",
  },
  {
    id: "a2",
    type: "delete",
    user: "Ali",
    action: "deleted task",
    target: "Fix header spacing",
    time: "2026-04-14T08:45:00",
  },
  {
    id: "a3",
    type: "role",
    user: "Sara",
    action: "updated role",
    target: "Omar Khaled → PM",
    time: "2026-04-13T16:20:00",
  },
  {
    id: "a4",
    type: "archive",
    user: "Mona",
    action: "archived project",
    target: "Legacy Portal",
    time: "2026-04-13T11:03:00",
  },
  {
    id: "a5",
    type: "invite",
    user: "Karim",
    action: "invited user",
    target: "nour@taskflow.dev",
    time: "2026-04-12T14:50:00",
  },
]

export function formatActivityTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}
