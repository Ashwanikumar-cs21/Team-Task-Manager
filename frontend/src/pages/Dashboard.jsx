import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const priorityColor = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const statusColor = {
  todo: "bg-gray-100 text-gray-600",
  inprogress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const statusLabel = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
};

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // ✅ FIX: correct API route
        const res = await API.get("/api/tasks/dashboard");

        console.log("DASHBOARD DATA:", res.data);

        setStats(res.data);
      } catch (err) {
        console.log("DASHBOARD ERROR:", err.response || err.message);

        // 🔥 better error message
        if (err.response?.status === 401) {
          setError("Unauthorized - Please login again");
        } else {
          setError("Failed to load dashboard");
        }
      }
    };

    fetchDashboard();
  }, []);

  const completionPct =
    stats && stats.total > 0
      ? Math.round((stats.done / stats.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-xl font-bold">
            Welcome, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of tasks across your projects.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border text-red-600 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!stats ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Tasks" value={stats.total} />
              <StatCard label="To Do" value={stats.todo} />
              <StatCard label="In Progress" value={stats.inprogress} />
              <StatCard label="Completed" value={stats.done} />
            </div>

            {stats.overdue > 0 && (
              <div className="bg-red-50 border rounded-lg px-5 py-4 mb-6 flex justify-between">
                <div>
                  <p className="text-red-700 font-semibold text-sm">
                    {stats.overdue} overdue task
                    {stats.overdue > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/projects")}
                  className="text-red-600 text-xs hover:underline"
                >
                  View Projects
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl border p-5 mb-6">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-semibold">Overall Completion</p>
                <p className="text-sm font-bold text-blue-600">
                  {completionPct}%
                </p>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate("/projects")}
                className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700"
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