import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

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

  // FIXED: correct API route + error handling
  const load = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.log("LOAD PROJECT ERROR:", err.response || err.message);
      setError("Failed to load projects");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // FIXED: correct API route + debug logs
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
      console.log("CREATE ERROR:", err.response || err.message);
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors w-full sm:w-auto"
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="font-semibold mb-4 text-lg">New Project</h2>

            <form onSubmit={create} className="space-y-3">
              <input
                placeholder="Project name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                rows="3"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-60 text-sm font-medium transition-colors"
                >
                  {loading ? "Creating..." : "Create"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No projects yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {projects.map((p, i) => {
              const myEntry = p.members?.find(
                (m) => String(m.user?._id) === user?._id
              );

              const myRole = myEntry?.role ?? "member";

              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="bg-white border border-gray-200 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className={`h-1.5 ${CARD_COLORS[i % CARD_COLORS.length]}`} />

                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h2 className="font-semibold text-gray-800 text-sm leading-snug">{p.name}</h2>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap shrink-0">
                        {myRole}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {p.description || "No description"}
                    </p>

                    {/* Members section */}
                    {p.members && p.members.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {p.members.slice(0, 5).map((m) => {
                            const memberName = m.user?.name || m.name || "?";
                            return (
                              <div
                                key={m.user?._id || m._id}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold border border-white"
                                title={memberName}
                              >
                                {memberName[0]?.toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                        {p.members.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{p.members.length - 5} more
                          </span>
                        )}
                        {p.members.length <= 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            {p.members.length} member{p.members.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
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