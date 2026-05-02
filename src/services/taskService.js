import { requestWithFallback } from "./requestWithFallback"

export const getTasks = (projectId) =>
  requestWithFallback([
    { method: "get", url: `/task/GetByProjectId/${projectId}` },
    { method: "get", url: "/task", config: { params: { projectId } } },
  ])

export const createTask = (data) =>
  requestWithFallback([
    {
      method: "post",
      url: "/task",
      data: {
        title: data.title,
        description: data.description ?? "",
        projectId: Number(data.projectId),
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        priority: data.priority ?? "low",
      },
    },
  ])

export const updateTask = (data) =>
  requestWithFallback([
    {
      method: "post",
      url: "/task/update",
      data: {
        id: data.id ?? data.taskId,
        status: data.status
      },
    },
  ])

  
export const assignTask = (data) =>
  requestWithFallback([
    { method: "post", url: "/task/assign", data: { taskId: data.taskId, assignedTo: data.assignedTo } },
  ])

export const deleteTask = (taskId) =>
  requestWithFallback([
    { method: "post", url: "/task/delete", data: Number(taskId) },
  ])

export const getTaskHistory = (taskId) =>
  requestWithFallback([
    { method: "get", url: "/task", config: { params: { taskId } } },
  ])

export const getMyTasks = () =>
  requestWithFallback([
    { method: "get", url: "/task/myTasks" },
    { method: "get", url: "/Task/GetMyTasks" },
  ])


