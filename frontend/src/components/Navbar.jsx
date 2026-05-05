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
    <nav className="nav-bar">
      {/* Left: brand + nav links */}
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/dashboard" className="nav-brand">
          <span className="nav-brand-mark">TM</span>
          <span className="hidden sm:inline">TaskManager</span>
        </Link>
        
        {/* Desktop nav links */}
        <div className="hidden md:flex gap-2 nav-links">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/projects", "Projects")}
        </div>
      </div>

      {/* Right: user info + logout (desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2">
            <div className="nav-avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-blue-100">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="nav-button"
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
          <div className="flex flex-col gap-2 px-4 py-4 mobile-menu">
            {navLink("/dashboard", "Dashboard")}
            {navLink("/projects", "Projects")}
            
            <div className="border-t border-blue-600 pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="nav-avatar">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-blue-100">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="nav-button text-xs"
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
