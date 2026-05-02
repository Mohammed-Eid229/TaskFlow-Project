import { requestWithFallback } from "./requestWithFallback"

export const getComments = (taskId) =>
  requestWithFallback([
    { method: "get", url: "/Comments/GetByTaskId", config: { params: { taskId } } },
    { method: "get", url: `/Comments/GetByTaskId/${taskId}` },
  ])

export const addComment = (data) =>
  requestWithFallback([
    { method: "post", url: "/Comments/Add", data },
  ])

export const deleteComment = (commentId) =>
  requestWithFallback([
    { method: "delete", url: "/Comments/Delete", config: { params: { commentId } } },
  ])
