import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Log out and redirect to login page
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Renders a nav link with active highlight based on current path
  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
        pathname.startsWith(to)
          ? "bg-white/20 text-white"
          : "text-blue-100 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      {/* Left: brand + nav links */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="font-bold text-base flex items-center gap-2">
          <span className="bg-white text-blue-700 rounded px-2 py-0.5 text-xs font-black">TM</span>
          TaskManager
        </Link>
        {navLink("/dashboard", "Dashboard")}
        {navLink("/projects", "Projects")}
      </div>

      {/* Right: user avatar initial + name + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Avatar shows first letter of user's name */}
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-blue-100 hidden sm:block">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
