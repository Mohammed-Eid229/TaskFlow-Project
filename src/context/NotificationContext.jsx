/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../services/userService"
import { useToast } from "./ToastContext"
import { useAuth } from "./AuthContext"
import signalRService from "../services/signalRService"
import { TOKEN_KEY } from "../constants/storage"

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const getUserRole = () => {
    const role = user?.role || user?.displayRole || ""
    const roleStr = String(role || "")
    const roleLower = roleStr.toLowerCase().replace(/\s/g, "")
    if (roleLower === "admin") return "admin"
    if (roleLower === "projectmanager") return "pm"
    return "member"
  }

  const filterNotificationsByRole = (notificationsList, role) => {
    // Filter assignment notifications - only show to team/project members
    return notificationsList.filter((n) => {
      // If it's not an assignment notification, show to everyone
      if (n.type !== "assignment" && !n.message?.toLowerCase().includes("assigned") && !n.message?.toLowerCase().includes("to task")) {
        return true
      }
      
      // For assignment notifications, only show if:
      // 1. User is the target (assigned user)
      // 2. User is a PM or admin
      // 3. User's name appears in the notification message (fallback)
      const userRole = getUserRole()
      const isTargetUser = n.targetUserId === user?.id
      const isPMOrAdmin = userRole === "pm" || userRole === "admin"
      
      // Fallback: check if user's name appears in the message
      if (!isTargetUser && !isPMOrAdmin) {
        const userNames = [
          user?.fullName?.toLowerCase(),
          user?.email?.toLowerCase(),
          user?.firstName?.toLowerCase(),
          user?.lastName?.toLowerCase()
        ].filter(Boolean)
        
        const messageLower = n.message?.toLowerCase() || ""
        const nameAppearsInMessage = userNames.some(name => 
          name && messageLower.includes(name)
        )
        
        return nameAppearsInMessage
      }
      
      return isTargetUser || isPMOrAdmin
    })
  }

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getMyNotifications()
      console.log("Full API Response:", res)
      
      let list = res?.data?.data ?? res?.data ?? []
      console.log("Extracted List:", list)
      
      // Filter notifications based on role and permissions
      list = filterNotificationsByRole(list, getUserRole())
      
      const formatted = list.map((n) => {
        let displayMessage = n.message || ""
        
        // Smart messaging logic
        if (displayMessage.toLowerCase().includes("has been assigned a new task")) {
          if (n.targetUserId === user?.id) {
            displayMessage = displayMessage.replace(/.* has been assigned/i, "You have been assigned")
          }
        }
        
        // Handle generic task update messages that might be assignments
        if (displayMessage.toLowerCase().includes("task") && displayMessage.toLowerCase().includes("updated") && !displayMessage.toLowerCase().includes("assigned")) {
          // If this is a task update notification and the user is the target, it might be an assignment
          if (n.targetUserId === user?.id && n.type !== "comment" && n.type !== "attachment") {
            displayMessage = displayMessage.replace(/task.*updated/i, "You have been assigned to this task")
          }
        }
        
        // Handle assignment notifications with "You" logic
        if (displayMessage.toLowerCase().includes("assigned") && (n.type === "assignment" || displayMessage.toLowerCase().includes("to task"))) {
          const userName = user?.fullName || user?.email?.split('@')[0] || ""
          
          // If user is the assigner
          if (displayMessage.toLowerCase().startsWith(userName.toLowerCase())) {
            displayMessage = displayMessage.replace(new RegExp(`^${userName}`, 'i'), "You")
          }
          
          // If user is the assignee (targetUserId matches)
          if (n.targetUserId === user?.id) {
            // Extract the assignee name and replace with "You"
            const assigneePattern = /assigned\s+([^\\s]+)\s+to\s+task/i
            displayMessage = displayMessage.replace(assigneePattern, "assigned You to task")
          }
        }
        
        // Handle attachment notifications
        if (displayMessage.toLowerCase().includes("attachment") || n.type === "attachment") {
          if (n.targetUserId === user?.id) {
            displayMessage = displayMessage.replace(/new attachment/i, "A new attachment")
          }
        }
        
        // Handle comment notifications
        if (displayMessage.toLowerCase().includes("comment") || n.type === "comment") {
          if (n.targetUserId === user?.id) {
            displayMessage = displayMessage.replace(/someone commented/i, "Someone commented")
          }
        }
        
        return {
          id: n.id,
          message: displayMessage,
          type: n.type || "task",
          read: n.isRead === true || n.read === true,
          createdAt: n.createdAt,
          targetUserId: n.targetUserId
        }
      })
      
      setNotifications(formatted)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      showToast("Failed to load notifications", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast, user])

  const markAsRead = async (notificationId) => {
    // Update locally
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    
    // Save to localStorage (per user)
    if (user?.id) {
      const key = `readNotifications_${user.id}`
      const readNotifications = JSON.parse(localStorage.getItem(key) || "[]")
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId)
        localStorage.setItem(key, JSON.stringify(readNotifications))
      }
    }

    // Try API but don't crash if it fails
    try {
      await markNotificationAsRead(notificationId)
    } catch (error) {
      console.warn("Backend markAsRead failed, using localStorage only")
    }
  }

  const markAllAsRead = async () => {
    // Update locally
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    
    // Save all to localStorage
    if (user?.id) {
      const key = `readNotifications_${user.id}`
      const allIds = notifications.map(n => n.id)
      localStorage.setItem(key, JSON.stringify(allIds))
    }
    
    // Try API but don't crash if it fails
    try {
      await markAllNotificationsAsRead()
      showToast("All notifications marked as read", "success")
    } catch (error) {
      console.warn("Backend markAllAsRead failed, using localStorage only")
      showToast("All marked as read (locally)", "success")
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && user) {
      signalRService.startConnection(token).then(() => {
        signalRService.onReceiveNotification((data) => {
          console.log("Real-time notification received:", data)
          console.log("Notification targetUserId:", data.targetUserId)
          console.log("Current user ID:", user?.id)
          console.log("Current user email:", user?.email)
          console.log("Is notification for current user?", data.targetUserId === user?.id)
          
          // Special handling for assignment notifications that might not have correct targetUserId
          const isAssignmentNotification = data.type === "assignment" || 
                                         data.message?.toLowerCase().includes("assigned") || 
                                         data.message?.toLowerCase().includes("has been assigned a new task")
          
          console.log("Is assignment notification?", isAssignmentNotification)
          
          // For assignment notifications, if targetUserId doesn't match current user, 
          // check if the message contains the current user's name/email
          let shouldShowNotification = data.targetUserId === user?.id
          
          if (isAssignmentNotification && !shouldShowNotification) {
            const userNames = [
              user?.fullName?.toLowerCase(),
              user?.email?.toLowerCase(),
              user?.firstName?.toLowerCase(),
              user?.lastName?.toLowerCase()
            ].filter(Boolean)
            
            const messageLower = data.message?.toLowerCase() || ""
            shouldShowNotification = userNames.some(name => 
              name && messageLower.includes(name)
            )
            
            console.log("Fallback name matching result:", shouldShowNotification)
          }
          
          if (!shouldShowNotification) {
            console.log("Notification not for this user, skipping...")
            return
          }
          
          let displayMessage = data.message
          if (displayMessage.toLowerCase().includes("has been assigned a new task")) {
            if (data.targetUserId === user?.id) {
              displayMessage = displayMessage.replace(/.* has been assigned/i, "You have been assigned")
            }
          }
          
          // Handle generic task update messages that might be assignments
          if (displayMessage.toLowerCase().includes("task") && displayMessage.toLowerCase().includes("updated") && !displayMessage.toLowerCase().includes("assigned")) {
            // If this is a task update notification and the user is the target, it might be an assignment
            if (data.targetUserId === user?.id && data.type !== "comment" && data.type !== "attachment") {
              displayMessage = displayMessage.replace(/task.*updated/i, "You have been assigned to this task")
            }
          }
          
          // Handle assignment notifications with "You" logic
          if (displayMessage.toLowerCase().includes("assigned") && (data.type === "assignment" || displayMessage.toLowerCase().includes("to task"))) {
            const userName = user?.fullName || user?.email?.split('@')[0] || ""
            
            // If user is the assigner
            if (displayMessage.toLowerCase().startsWith(userName.toLowerCase())) {
              displayMessage = displayMessage.replace(new RegExp(`^${userName}`, 'i'), "You")
            }
            
            // If user is the assignee (targetUserId matches)
            if (data.targetUserId === user?.id) {
              // Extract the assignee name and replace with "You"
              const assigneePattern = /assigned\s+([^\\s]+)\s+to\s+task/i
              displayMessage = displayMessage.replace(assigneePattern, "assigned You to task")
            }
          }
          
          // Handle attachment notifications
          if (displayMessage.toLowerCase().includes("attachment") || data.type === "attachment") {
            if (data.targetUserId === user?.id) {
              displayMessage = displayMessage.replace(/new attachment/i, "A new attachment")
            }
          }
          
          // Handle comment notifications
          if (displayMessage.toLowerCase().includes("comment") || data.type === "comment") {
            if (data.targetUserId === user?.id) {
              displayMessage = displayMessage.replace(/someone commented/i, "Someone commented")
            }
          }

          const newNotification = {
            id: data.id || Date.now(),
            message: displayMessage,
            type: data.type || "task",
            read: false,
            createdAt: new Date().toISOString(),
            targetUserId: data.targetUserId
          }

          // Apply filtering to real-time notifications
          const filteredNotification = filterNotificationsByRole([newNotification], getUserRole())
          if (filteredNotification.length > 0) {
            setNotifications(prev => [newNotification, ...prev])
            showToast(displayMessage, "info")
          }
        })
      })
    }

    return () => {
      signalRService.stopConnection()
    }
  }, [user, showToast])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [fetchNotifications, user])

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