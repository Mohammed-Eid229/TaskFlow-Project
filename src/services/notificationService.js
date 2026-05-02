import { requestWithFallback } from "./requestWithFallback"

export const getMyNotifications = () =>
  requestWithFallback([
    { method: "get", url: "/Notification/GetMyNotifications" },
  ])
