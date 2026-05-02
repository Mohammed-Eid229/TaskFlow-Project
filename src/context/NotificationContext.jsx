import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getMyNotifications } from "../services/userService"
import { useToast } from "./ToastContext"
import { useAuth } from "./AuthContext"

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const getUserRole = () => {
  const role = user?.role || user?.displayRole || ""
  // تأكد إن role string
  const roleStr = String(role || "")
  const roleLower = roleStr.toLowerCase().replace(/\s/g, "")
  if (roleLower === "admin") return "admin"
  if (roleLower === "projectmanager") return "pm"
  return "member"
}

  const filterNotificationsByRole = (notificationsList, role) => {
    if (role === "admin") {
      console.log("Admin: Showing all notifications")
      return notificationsList
    }
    if (role === "pm") {
      console.log("PM: Showing all project notifications")
      return notificationsList
    }
    console.log("Member: Filtering only assign notifications")
    return notificationsList.filter(n => 
      n.message?.toLowerCase().includes("you have been assigned") ||
      n.message?.toLowerCase().includes("assigned to you")
    )
  }

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getMyNotifications()
      let list = res?.data?.data ?? res?.data ?? []
      
      const userRole = getUserRole()
      console.log("User role:", userRole)
      console.log("Raw notifications list:", list)
      
      const filteredList = filterNotificationsByRole(list, userRole)
      console.log("Filtered notifications:", filteredList)
      
      const formatted = filteredList.map((n) => ({
        id: n.id,
        message: n.message,
        type: n.type || "task",
        read: false, // كل الإشعارات جديدة
        createdAt: n.createdAt,
      }))
      
      // جلب الإشعارات المقروءة من localStorage
      const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "[]")
      
      // تطبيق القراءة المخزنة
      const notificationsWithRead = formatted.map(n => ({
        ...n,
        read: readNotifications.includes(n.id)
      }))
      
      setNotifications(notificationsWithRead)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      showToast("Failed to load notifications", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const markAsRead = async (notificationId) => {
    // تحديث محلي من غير API
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    
    // حفظ في localStorage
    const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "[]")
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId)
      localStorage.setItem("readNotifications", JSON.stringify(readNotifications))
    }
    
    showToast("Notification marked as read", "success")
  }

  const markAllAsRead = async () => {
    // تحديث محلي لكل الإشعارات
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    
    // حفظ كل الـ IDs في localStorage
    const allIds = notifications.map(n => n.id)
    localStorage.setItem("readNotifications", JSON.stringify(allIds))
    
    showToast("All notifications marked as read", "success")
  }

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        unreadCount,
        userRole: getUserRole(),
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}