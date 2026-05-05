import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const priorityColor = {
  low:    "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
};
const statusColor = {
  todo:       "bg-gray-100 text-gray-600",
  inprogress: "bg-blue-100 text-blue-700",
  done:       "bg-green-100 text-green-700",
};
const statusLabel = { todo: "To Do", inprogress: "In Progress", done: "Done" };

function StatCard({ label, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError]  = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/tasks/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  const completionPct =
    stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-content">

        <div className="mb-6 sm:mb-8">
          <h1 className="page-heading">
            Welcome, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of tasks across your projects.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat cards - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
              <div className="card p-5">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500 mt-1">Total Tasks</p>
              </div>
              <div className="card p-5">
                <p className="text-2xl font-bold text-slate-900">{stats.todo}</p>
                <p className="text-sm text-slate-500 mt-1">To Do</p>
              </div>
              <div className="card p-5">
                <p className="text-2xl font-bold text-blue-600">{stats.inprogress}</p>
                <p className="text-sm text-slate-500 mt-1">In Progress</p>
              </div>
              <div className="card p-5">
                <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                <p className="text-sm text-slate-500 mt-1">Completed</p>
              </div>
            </div>

            {/* Overdue banner */}
            {stats.overdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 sm:px-5 py-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-red-700 font-semibold text-sm">
                    {stats.overdue} overdue task{stats.overdue > 1 ? "s" : ""}
                  </p>
                  <p className="text-red-500 text-xs mt-0.5">
                    These tasks are past their due date and not yet completed.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/projects")}
                  className="text-xs text-red-600 font-medium hover:underline shrink-0 whitespace-nowrap"
                >
                  View Projects
                </button>
              </div>
            )}

            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                <p className="text-sm font-semibold text-gray-700">Overall Completion</p>
                <p className="text-sm font-bold text-blue-600">{completionPct}%</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 sm:mt-1.5">
                <span>{stats.done} completed</span>
                <span>{stats.total - stats.done} remaining</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Overdue tasks</p>
                  <p className="text-xs text-red-600 mt-1">
                    {stats.overdue} overdue task{stats.overdue !== 1 ? "s" : ""} still need attention.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-700">{stats.overdue}</span>
                  Review overdue items
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks per user */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <h2 className="font-semibold text-gray-700 mb-4 text-base">Tasks per Member</h2>
                {Object.keys(stats.byUser).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No assignments yet</p>
                ) : (
                  <ul className="space-y-3">
                    {Object.entries(stats.byUser)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => {
                        const max = Math.max(...Object.values(stats.byUser));
                        return (
                          <li key={name}>
                            <div className="flex justify-between text-sm mb-1 gap-2">
                              <span className="text-gray-700 truncate">{name}</span>
                              <span className="text-blue-600 font-semibold shrink-0">{count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${(count / max) * 100}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>

              {/* Recent tasks */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <h2 className="font-semibold text-gray-700 mb-4 text-base">Recent Tasks</h2>
                {stats.recentTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No tasks yet</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.recentTasks.map((t) => (
                      <li key={t._id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-700 truncate">{t.title}</span>
                        <div className="flex gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[t.priority]}`}>
                            {t.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status]}`}>
                            {statusLabel[t.status]}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate("/projects")}
                className="button-primary"
              >
                Go to Projects
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
