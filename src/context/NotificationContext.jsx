import { createContext, useContext, useState } from "react"

const NotificationContext = createContext()

export function NotificationProvider({ children }) {

  const [notifications,setNotifications] = useState([
    {
      id:1,
      message:"You have been assigned to task 'Design UI'",
      time:"2 minutes ago",
      read:false
    },
    {
      id:2,
      message:"Project updated",
      time:"1 hour ago",
      read:true
    },
    {
      id:3,
      message:"New comment on task",
      time:"Yesterday",
      read:false
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {

    const updated = notifications.map(n => {

      if(n.id === id){
        return { ...n, read:true }
      }

      return n
    })

    setNotifications(updated)
  }

  return(

    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead
      }}
    >

      {children}

    </NotificationContext.Provider>

  )

}

export const useNotifications = () => useContext(NotificationContext)