import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { isAdmin } from "../utils/roles"

export default function AdminRoute() {
  const { user } = useAuth()
  if (!isAdmin(user)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
