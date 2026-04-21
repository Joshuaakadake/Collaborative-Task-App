import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 dark:bg-gray-800 text-white shadow-md">

      {/* Main bar */}
      <div className="px-6 py-4 flex items-center justify-between">

        {/* Left — App name */}
        <div className="text-lg md:text-xl font-bold tracking-wide">
          PROFLOW
        </div>

        {/* Middle — Desktop links */}
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/dashboard" className="hover:text-blue-200 transition">
            Dashboard
          </Link>
          <Link to="/tasks" className="hover:text-blue-200 transition">
            Tasks
          </Link>
        </div>

        {/* Right — Desktop user + logout */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm">
            Hello, <span className="font-semibold">{user?.name}</span>
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm bg-white text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            Logout
          </button>
        </div>

        {/* Hamburger + dark mode — mobile only */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm bg-white text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 p-1"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700 dark:bg-gray-700 px-6 py-4 flex flex-col gap-4">
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium hover:text-blue-200 transition"
          >
            Dashboard
          </Link>
          <Link
            to="/tasks"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium hover:text-blue-200 transition"
          >
            Tasks
          </Link>
          <hr className="border-blue-500" />
          <span className="text-sm">
            Hello, <span className="font-semibold">{user?.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition w-full"
          >
            Logout
          </button>
        </div>
      )}

    </nav>
  );
}