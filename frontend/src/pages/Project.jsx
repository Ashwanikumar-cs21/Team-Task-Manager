import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const STATUSES = ["todo", "inprogress", "done"];
const STATUS_LABEL = { todo: "To Do", inprogress: "In Progress", done: "Done" };
const STATUS_COLUMN = {
  todo:       "bg-gray-50 border-gray-200",
  inprogress: "bg-blue-50 border-blue-200",
  done:       "bg-green-50 border-green-200",
};
const PRIORITY_COLOR = {
  low:    "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
};

// Works for both old flat ObjectId members and new {user, role} subdocuments
const getMemberId = (m) => {
  if (m?.user?._id) return String(m.user._id);  // new format populated
  if (m?.user)      return String(m.user);       // new format unpopulated
  if (m?._id)       return String(m._id);        // old format populated
  return String(m);                              // old format raw ObjectId
};
const getMemberRole = (m, project) =>
  m.role || (getMemberId(m) === String(project?.createdBy?._id) ? "admin" : "member");

function TaskCard({ task, isAdmin, isAssigned, isMember, onStatusChange, onDelete, onDragStart }) {
  const canEdit = isAdmin || isAssigned;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, task._id)}
      className={`task-card ${isOverdue ? "overdue" : ""} ${
        canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-gray-800 text-sm leading-snug flex-1">{task.title}</p>
        <span className={`priority-badge ${task.priority}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-col gap-3 mt-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          {task.assignedTo ? (
            <span className="assignee-badge">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs flex items-center justify-center font-bold">
                {task.assignedTo.name[0]?.toUpperCase()}
              </span>
              {task.assignedTo.name}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">Unassigned</span>
          )}
          {task.dueDate && (
            <span className={`text-xs whitespace-nowrap ${isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
              {isOverdue ? "Overdue:" : "Due:"} {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {(canEdit || isMember) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all hover:border-gray-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => onDelete(task._id)}
              className="px-2.5 py-1.5 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-all hover:border-red-400"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Project() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [activity, setActivity]       = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("board");

  const dragTaskId = useRef(null);

  const isAdmin = project?.members?.some(
    (m) => getMemberId(m) === user?._id &&
      getMemberRole(m, project) === "admin"
  );

  const loadProject  = () => API.get(`/projects/${id}`).then((res) => setProject(res.data));
  const loadTasks    = () => API.get(`/tasks/${id}`).then((res) => setTasks(res.data));
  const loadActivity = () => API.get(`/activity/${id}`).then((res) => setActivity(res.data)).catch(() => {});

  useEffect(() => {
    loadProject();
    loadTasks();
    loadActivity();
  }, [id]);

  const createTask = async (form) => {
    try {
      await API.post("/tasks", { ...form, project: id });
      setShowModal(false);
      loadTasks();
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      loadTasks();
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      loadTasks();
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    try {
      const res = await API.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(res.data);
      setMemberEmail("");
      loadActivity();
    } catch (err) {
      setMemberError(err.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await API.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  const updateRole = async (userId, role) => {
    try {
      const res = await API.put(`/projects/${id}/members/${userId}/role`, { role });
      setProject(res.data);
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const onDragStart = (e, taskId) => { dragTaskId.current = taskId; };
  const onDragOver  = (e) => e.preventDefault();
  const onDrop      = (e, status) => {
    e.preventDefault();
    if (dragTaskId.current) updateStatus(dragTaskId.current, status);
    dragTaskId.current = null;
  };

  if (!project)
    return (
      <div className="page-shell">
        <Navbar />
        <div className="page-content flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  const grouped = { todo: [], inprogress: [], done: [] };
  tasks.forEach((t) => grouped[t.status]?.push(t));

  // Normalise members for rendering — handles both old and new formats
  const normalizedMembers = project.members.map((m) => ({
    id:    getMemberId(m),
    name:  m.user?.name  || m.name  || "Unknown",
    email: m.user?.email || m.email || "",
    role:  getMemberRole(m, project),
  })).filter((m) => m.id && m.id !== "undefined");

  return (
    <div className="page-shell">
      <Navbar />

      {showModal && (
        <TaskModal
          members={normalizedMembers.map((m) => ({ _id: m.id, name: m.name }))}
          onClose={() => setShowModal(false)}
          onSave={createTask}
        />
      )}

      <div className="page-content">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
          <div className="flex-1">
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block"
            >
              &larr; Projects
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{project.name}</h1>
            {project.description && (
              <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="button-primary w-full sm:w-auto"
            >
              + Add Task
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {["board", "members", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "board" ? "Board" : tab === "members" ? "Members" : "Activity"}
            </button>
          ))}
        </div>

        {/* ── BOARD TAB ── */}
        {activeTab === "board" && (
          <div className="kanban-board">
            {STATUSES.map((status) => (
              <div
                key={status}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                className={`kanban-column ${status}-col min-h-[300px] md:min-h-[400px] flex flex-col`}
              >
                <div className="kanban-column-header">
                  <h2 className="font-semibold text-sm text-gray-700">{STATUS_LABEL[status]}</h2>
                  <span className="task-count">
                    {grouped[status].length}
                  </span>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {grouped[status].length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-12">No tasks yet</p>
                  )}
                  {grouped[status].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isAdmin={isAdmin}
                      isAssigned={String(task.assignedTo?._id) === user?._id}
                      isMember={true}
                      onStatusChange={updateStatus}
                      onDelete={deleteTask}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="font-semibold text-gray-800 mb-4 text-lg">
              Team Members ({normalizedMembers.length})
            </h2>

            <ul className="space-y-3 mb-6">
              {normalizedMembers.map((m) => (
                <li key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border text-center ${
                      m.role === "admin"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      {m.role === "admin" ? "Admin" : "Member"}
                    </span>
                    {isAdmin && m.id !== String(project.createdBy?._id) && (
                      <>
                        <button
                          onClick={() => updateRole(m.id, m.role === "admin" ? "member" : "admin")}
                          className="text-xs text-indigo-400 hover:text-indigo-600 border border-indigo-200 hover:border-indigo-400 px-2 py-1 rounded transition-colors"
                        >
                          Make {m.role === "admin" ? "Member" : "Admin"}
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {isAdmin && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Add Member by Email</p>
                <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="member@example.com"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </form>
                {memberError && (
                  <p className="text-red-500 text-xs mt-2">{memberError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="font-semibold text-gray-800 mb-4 text-lg">Activity Log</h2>
            {activity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
            ) : (
              <div className="activity-list">
                {activity.map((log) => (
                  <div key={log._id} className="activity-entry">
                    <div className="activity-avatar">
                      {log.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="activity-content">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{log.user?.name}</span> {log.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
