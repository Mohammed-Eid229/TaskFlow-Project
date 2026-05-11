import { requestWithFallback } from "./requestWithFallback"
import api from "./api"

export const getMyProfile = () =>
  requestWithFallback([
    { method: "get", url: "/user/me" },
  ])

export const updateProfile = (data) =>
  requestWithFallback([
    {
      method: "post",
      url: "/user/me",
      data: {
        firstName: data.fullName?.split(" ")[0] ?? "",
        lastName: data.fullName?.split(" ").slice(1).join(" ") ?? "",
        email: data.email,
      },
    },
  ])

export const changePassword = (data) =>
  requestWithFallback([
    { method: "post", url: "/user/change-password", data },
  ])

export const uploadProfileImage = (file) => {
  const form = new FormData()
  form.append("file", file)
  return api.post("/user/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

export const getUserDashboard = () =>
  requestWithFallback([
    { method: "get", url: "/user/dashboard" },
  ])

export const getActivityTrend = () =>
  requestWithFallback([
    { method: "get", url: "/user/activity-trend" },
  ])

export const getAllUsers = () =>
  requestWithFallback([
    { method: "get", url: "/user/all" },
  ])

export const getUserById = (id) =>
  requestWithFallback([
    { method: "get", url: `/user/${id}` },
  ])

export const getAdminDashboard = () =>
  requestWithFallback([
    { method: "get", url: "/user/adminDashboard" },
  ])

export const getPendingUsers = () =>
  requestWithFallback([
    { method: "get", url: "/user/pending" },
  ])

export const approveUser = (userId) =>
  requestWithFallback([
    { method: "post", url: `/user/approve/${userId}` },
  ])

export const rejectUser = (userId) =>
  requestWithFallback([
    { method: "post", url: `/user/reject/${userId}` },
  ])

export const changeUserRole = (data) =>
  requestWithFallback([
    { method: "post", url: "/user/change-role", data },
  ])

export const deleteUser = (id) =>
  requestWithFallback([
    { method: "delete", url: `/user/delete-user/${id}` },
  ])


export const getUserByEmail = (email) =>
  requestWithFallback([
    { method: "get", url: `/User/GetByEmail/${email}` },
    { method: "get", url: `/user/email/${email}` },
  ])

export const getRecentActivities = () =>
  requestWithFallback([
    { method: "get", url: "/activity/recent" },
  ])  

// أضف دول في userService.js

export const getAllUsersForAdmin = () =>
  requestWithFallback([
    { method: "get", url: "/user/all" },
    { method: "get", url: "/users" },
  ])

export const updateUserRole = (userId, role) =>
  requestWithFallback([
    { method: "post", url: "/user/change-role", data: { userId, role } },
  ])


export const getPendingPMRequests = () =>
  requestWithFallback([
    { method: "get", url: "/user/pending" },
  ])

export const approvePMRequest = (userId) =>
  requestWithFallback([
    { method: "post", url: `/user/approve/${userId}` },
  ])

export const rejectPMRequest = (userId) =>
  requestWithFallback([
    { method: "post", url: `/user/reject/${userId}` },
  ])

export const getAllProjectsForAdmin = () =>
  requestWithFallback([
    { method: "get", url: "/project" },
  ])

export const deleteProjectByAdmin = (projectId) =>
  requestWithFallback([
    { method: "post", url: "/project/delete", data: projectId },
  ])

export const getActivityLog = () =>
  requestWithFallback([
    { method: "get", url: "/activity/recent" },
  ])  

  export const getMyNotifications = () =>
  requestWithFallback([
    { method: "get", url: "/notifications/my" },
    { method: "get", url: "/Notification/GetMyNotifications" },
    { method: "get", url: "/notifications" },
  ])

export const markNotificationAsRead = (notificationId) =>
  requestWithFallback([
    { method: "post", url: `/notifications/${notificationId}/read` },
    { method: "post", url: `/notifications/read/${notificationId}` },
    { method: "post", url: `/notifications/${notificationId}/read` },
  ])

export const markAllNotificationsAsRead = () =>
  requestWithFallback([
    { method: "post", url: "/notifications/read-all" },
    { method: "post", url: "/Notification/MarkAllAsRead" },
    { method: "post", url: "/notifications/mark-all-read" },
  ])

