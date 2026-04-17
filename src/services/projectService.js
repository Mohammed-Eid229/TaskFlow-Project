import api from "./api"

export const getProjects = () => {

  return api.get("/projects")

}

export const createProject = (data) => {

  return api.post("/projects",data)

}