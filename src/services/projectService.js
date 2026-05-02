import { requestWithFallback } from "./requestWithFallback"

export const getProjects = () =>
  requestWithFallback([
    { method: "get", url: "/project/myProjects" },
    { method: "get", url: "/project" },
  ])

export const getProjectById = (id) =>
  requestWithFallback([
    { method: "get", url: `/project/${id}` },
  ])

export const getProjectDetails = (id) =>
  requestWithFallback([
    { method: "get", url: `/project/${id}/details` },
  ])

export const getProjectStats = (id) =>
  requestWithFallback([
    { method: "get", url: `/project/${id}/stats` },
  ])

export const getProjectDashboard = (id) =>
  requestWithFallback([
    { method: "get", url: `/project/${id}/dashboard` },
  ])

export const createProject = (data) =>
  requestWithFallback([
    { method: "post", url: "/project/", data: { Name: data.title ?? data.name, Description: data.description } },
  ])

export const updateProject = (data) =>
  requestWithFallback([
    { method: "post", url: "/project/update", data },
  ])

export const deleteProject = (projectId) =>
  requestWithFallback([
    { method: "post", url: "/project/delete", data: projectId },
  ])

export const getProjectWorkloads = (projectId) =>
  requestWithFallback([
    { method: "get", url: `/Project/TeamWorkload/${projectId}` },
  ])

export const getProjectProgress = (projectId) =>
  requestWithFallback([
    { method: "get", url: `/Project/Progress/${projectId}` },
  ])

 export const getProjectMembers = (projectId) =>
  requestWithFallback([
    { method: "get", url: `/projectMember/${projectId}` },
    { method: "get", url: `/ProjectMembers/GetByProjectId/${projectId}` },
    { method: "get", url: "/ProjectMembers/GetByProjectId", config: { params: { projectId } } },
  ])

export const addProjectMember = (data) =>
  requestWithFallback([
    { method: "post", url: "/projectMember", data },
  ])

export const addMemberByEmail = (data) =>
  requestWithFallback([
    { method: "post", url: "/projectMember/add-member", data },
  ])

export const removeProjectMember = (data) =>
  requestWithFallback([
    { method: "post", url: "/projectMember/RemoveMember", data },
  ])

export const getMyProjects = () =>
  requestWithFallback([
    { method: "get", url: "/project/myProjects" },
    { method: "get", url: "/Project/GetMyProjects" },
  ])  

export const searchUserByEmail = (email, projectId) =>
  requestWithFallback([
    { method: "get", url: `/ProjectMember/Search-User`, config: { params: { email, projectId } } },
  ])

