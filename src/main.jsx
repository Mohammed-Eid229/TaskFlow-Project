import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "./styles/theme.css"
import "./styles/layout-ui.css"
import "./styles/buttons.css"
import "./styles/cards.css"
import "./styles/profile.css"
import "./styles/kanban.css"
import "./styles/auth.css"
import "./styles/dashboard.css"
import "./styles/admin.css"

createRoot(document.getElementById("root")).render(<App />)
