import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useState } from "react"
// import { useAuth } from "../context/AuthContext"

export default function Layout({ children }) {

  // const { mockAuth } = useAuth()
  const [sidebarOpen,setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return(

    <div className="layout">

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={()=>setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen}/>

      <div className="main-layout">

        <Navbar toggleSidebar={toggleSidebar}/>

        <div className="page-content">

          <div className="container">
            {children}
          </div>

        </div>

      </div>

    </div>

  )

}