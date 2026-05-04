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
      const res = await API.get("/api/projects");
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
      await API.post("/api/projects", form);

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
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-semibold mb-4">New Project</h2>

            <form onSubmit={create} className="space-y-3">
              <input
                placeholder="Project name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border px-4 py-2 rounded"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border px-4 py-2 rounded"
              />

              {error && <p className="text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-5 py-2 rounded"
                >
                  {loading ? "Creating..." : "Create"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 px-5 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <p className="text-center text-gray-500">No projects yet</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => {
              const myEntry = p.members?.find(
                (m) => String(m.user?._id) === user?._id
              );

              const myRole = myEntry?.role ?? "member";

              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="bg-white border rounded-xl cursor-pointer hover:shadow"
                >
                  <div className={`h-1.5 ${CARD_COLORS[i % CARD_COLORS.length]}`} />

                  <div className="p-4">
                    <div className="flex justify-between mb-2">
                      <h2>{p.name}</h2>
                      <span className="text-xs">
                        {myRole}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
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