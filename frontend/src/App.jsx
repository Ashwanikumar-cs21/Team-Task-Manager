import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import ProjectList from "./pages/ProjectList";

// Guard component: redirects unauthenticated users to /login
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes require a logged-in user */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/projects" element={<Protected><ProjectList /></Protected>} />
      <Route path="/projects/:id" element={<Protected><Project /></Protected>} />
    </Routes>
  );
}
