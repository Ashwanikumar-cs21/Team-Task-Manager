import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// Accent colors cycled across project cards for visual distinction
const CARD_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-green-600",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-cyan-600",
];

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch all projects the current user belongs to
  const load = () =>
    API.get("/projects").then((res) => setProjects(res.data));

  useEffect(() => {
    load();
  }, []);

  // Create a new project and refresh the list
  const create = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/projects", form);
      setShowForm(false);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Page header with project count and create button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Inline create project form — toggled by the button above */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">New Project</h2>
            <form onSubmit={create} className="space-y-3">
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Description (optional)"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          // Project card grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => {
              const myEntry = p.members?.find((m) => String(m.user?._id) === user?._id);
              const myRole  = myEntry?.role ?? "member";
              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Thin color accent bar at top of card */}
                  <div className={`h-1.5 ${CARD_COLORS[i % CARD_COLORS.length]}`} />

                  <div className="p-5">
                    {/* Project name + role badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-semibold text-gray-800">{p.name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 border ${
                        myRole === "admin"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}>
                        {myRole === "admin" ? "Admin" : "Member"}
                      </span>
                    </div>

                    {/* Project description, capped at 2 lines */}
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                      {p.description || "No description"}
                    </p>

                    {/* Member avatars and creation date */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      {/* Stacked avatar initials for up to 4 members */}
                      <div className="flex -space-x-2">
                        {p.members?.slice(0, 4).map((m) => (
                          <div
                            key={m.user?._id}
                            title={`${m.user?.name} (${m.role})`}
                            className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                          >
                            {m.user?.name?.[0]?.toUpperCase()}
                          </div>
                        ))}
                        {/* Overflow indicator when more than 4 members */}
                        {p.members?.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-bold">
                            +{p.members.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
