import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Log out and redirect to login page
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Renders a nav link with active highlight based on current path
  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
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
    <nav className="bg-blue-700 text-white px-4 md:px-6 py-3 flex items-center justify-between shadow">
      {/* Left: brand + nav links */}
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/dashboard" className="font-bold text-base flex items-center gap-2">
          <span className="bg-white text-blue-700 rounded px-2 py-0.5 text-xs font-black">TM</span>
          <span className="hidden sm:inline">TaskManager</span>
        </Link>
        
        {/* Desktop nav links */}
        <div className="hidden md:flex gap-2">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/projects", "Projects")}
        </div>
      </div>

      {/* Right: user info + logout (desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Avatar shows first letter of user's name */}
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-blue-100">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden flex flex-col gap-1 focus:outline-none"
      >
        <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-blue-800 md:hidden shadow-lg z-50">
          <div className="flex flex-col gap-2 px-4 py-4">
            {navLink("/dashboard", "Dashboard")}
            {navLink("/projects", "Projects")}
            
            <div className="border-t border-blue-600 pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-blue-100">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1.5 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
