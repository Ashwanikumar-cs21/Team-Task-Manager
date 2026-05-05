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

  // ✅ FIXED: correct API route + error handling
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

  // ✅ FIXED: correct API route + debug logs
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
    <div className="page-shell">
      <Navbar />
      <div className="page-content">

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
          <div className="panel mb-6 sm:mb-8">
            <div className="p-6">
              <h2 className="section-title text-lg">New Project</h2>
            </div>
            <div className="panel-body p-6 pt-0">
              <form onSubmit={create} className="space-y-4">
                <input
                  placeholder="Project name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="input-field"
                />

                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input-field resize-none"
                  rows="3"
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary flex-1"
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="button-secondary flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
                  className="project-card"
                >
                  <div className={`project-card-top ${CARD_COLORS[i % CARD_COLORS.length]}`} />

                  <div className="project-card-body">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h2 className="project-card-title">{p.name}</h2>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap shrink-0">
                        {myRole}
                      </span>
                    </div>

                    <p className="project-card-description">
                      {p.description || "No description"}
                    </p>
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