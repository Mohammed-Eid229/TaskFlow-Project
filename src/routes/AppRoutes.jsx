import { Routes, Route, Navigate } from "react-router-dom"
import PublicRoute from "./PublicRoute"
import ProtectedRoute from "./ProtectedRoute"
import AdminRoute from "./AdminRoute"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import Projects from "../pages/Projects"
import ProjectDetails from "../pages/ProjectDetails"
import TaskDetails from "../pages/TaskDetails"
import Profile from "../pages/Profile"
import Notifications from "../pages/Notifications"
import Users from "../pages/Users"
import ActivityLog from "../pages/ActivityLog"
import AdminProjectView from "../pages/AdminProjectView"
import PendingUsers from "../pages/PendingUsers"

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route element={<AdminRoute />}>
          <Route path="/users" element={<Users />} />
          <Route path="/pending-users" element={<PendingUsers />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/admin/projects/:id" element={<AdminProjectView />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
