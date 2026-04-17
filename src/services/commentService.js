import api from "./api"

export const getComments = (taskId) => {

  return api.get(`/tasks/${taskId}/comments`)

}

export const addComment = (data) => {

  return api.post("/comments",data)

}