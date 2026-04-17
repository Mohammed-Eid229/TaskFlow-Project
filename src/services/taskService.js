import api from "./api"

export const getTasks = (projectId) => {

  return api.get(`/tasks/${projectId}`)

}

export const createTask = (data) => {

  return api.post("/tasks",data)

}