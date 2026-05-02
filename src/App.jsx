import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationContext"
import { ToastProvider } from "./context/ToastContext"
import AppRoutes from "./routes/AppRoutes"


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
