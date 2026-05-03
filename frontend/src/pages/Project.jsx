import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// Kanban column order
const STATUSES = ["todo", "inprogress", "done"];

const STATUS_LABEL = { todo: "To Do", inprogress: "In Progress", done: "Done" };

// Column container styles per status
const STATUS_COLUMN = {
  todo:       "bg-gray-50 border-gray-200",
  inprogress: "bg-blue-50 border-blue-200",
  done:       "bg-green-50 border-green-200",
};

// Priority badge colors
const PRIORITY_COLOR = {
  low:    "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
};

// Small colored dot next to priority badge
const PRIORITY_DOT = {
  low:    "bg-green-500",
  medium: "bg-yellow-500",
  high:   "bg-red-500",
};

// Individual task card rendered inside a Kanban column
function TaskCard({ task, isAdmin, isAssigned, onStatusChange, onDelete, onDragStart }) {
  const canEdit = isAdmin || isAssigned;

  // A task is overdue if it has a due date, that date is in the past, and it's not done
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, task._id)}
      className={`bg-white rounded-lg border p-3.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isOverdue ? "border-red-300" : "border-gray-200"
      }`}
    >
      {/* Task title and priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-gray-800 text-sm leading-snug">{task.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Optional description, capped at 2 lines */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Assignee avatar + due date row */}
      <div className="flex items-center justify-between mt-2">
        <div>
          {task.assignedTo && (
            <div className="flex items-center gap-1.5">
              {/* Avatar initial for assigned user */}
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {task.assignedTo.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
            </div>
          )}
        </div>
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {isOverdue ? "Overdue: " : "Due: "}
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Status selector and delete button — only visible to admin or assignee */}
      {canEdit && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => onDelete(task._id)}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors"
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

  const [project, setProject]     = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [activity, setActivity]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("board");

  // Ref holds the task ID being dragged so it's accessible in the drop handler
  const dragTaskId = useRef(null);

  // Current user is admin if they created the project
  const isAdmin = project && String(project.createdBy?._id) === user?._id;

  // Data fetchers — called on mount and after mutations
  const loadProject  = () => API.get(`/projects/${id}`).then((res) => setProject(res.data));
  const loadTasks    = () => API.get(`/tasks/${id}`).then((res) => setTasks(res.data));
  const loadActivity = () =>
    API.get(`/activity/${id}`)
      .then((res) => setActivity(res.data))
      .catch(() => {}); // activity is non-critical; silently ignore errors

  useEffect(() => {
    loadProject();
    loadTasks();
    loadActivity();
  }, [id]);

  // Create a new task and refresh tasks + activity log
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

  // Update a task's status (used by select dropdown and drag-and-drop)
  const updateStatus = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      loadTasks();
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update");
    }
  };

  // Delete a task after confirmation
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

  // Add a member to the project by email
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

  // Remove a member from the project
  const removeMember = async (userId) => {
    try {
      const res = await API.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
      loadActivity();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  // --- Drag-and-drop handlers ---
  const onDragStart = (e, taskId) => {
    dragTaskId.current = taskId;
  };
  const onDragOver = (e) => e.preventDefault(); // required to allow drop
  const onDrop = (e, status) => {
    e.preventDefault();
    if (dragTaskId.current) updateStatus(dragTaskId.current, status);
    dragTaskId.current = null;
  };

  // Show spinner while project data loads
  if (!project)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  // Group tasks by status for the Kanban board columns
  const grouped = { todo: [], inprogress: [], done: [] };
  tasks.forEach((t) => grouped[t.status]?.push(t));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Task creation modal */}
      {showModal && (
        <TaskModal
          members={project.members}
          onClose={() => setShowModal(false)}
          onSave={createTask}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Project header: back link, name, description, add-task button */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-gray-400 hover:text-gray-600 mb-1"
            >
              &larr; Projects
            </button>
            <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
            {project.description && (
              <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Add Task
            </button>
          )}
        </div>

        {/* Global error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mt-3">
            {error}
          </div>
        )}

        {/* Tab navigation: Board / Members / Activity */}
        <div className="flex gap-1 mt-5 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
          {["board", "members", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "board" ? "Board" : tab === "members" ? "Members" : "Activity"}
            </button>
          ))}
        </div>

        {/* ── BOARD TAB ── Kanban columns with drag-and-drop support */}
        {activeTab === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map((status) => (
              <div
                key={status}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                className={`rounded-xl border-2 border-dashed min-h-[200px] ${STATUS_COLUMN[status]}`}
              >
                {/* Column header with task count */}
                <div className="px-4 py-3 border-b border-inherit">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-gray-700">{STATUS_LABEL[status]}</h2>
                    <span className="text-xs font-bold bg-white/70 px-2 py-0.5 rounded-full">
                      {grouped[status].length}
                    </span>
                  </div>
                </div>

                {/* Task cards */}
                <div className="p-3 space-y-3">
                  {grouped[status].length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">No tasks</p>
                  )}
                  {grouped[status].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isAdmin={isAdmin}
                      isAssigned={String(task.assignedTo?._id) === user?._id}
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

        {/* ── MEMBERS TAB ── List of project members with add/remove controls */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
            <h2 className="font-semibold text-gray-800 mb-4">
              Team Members ({project.members.length})
            </h2>

            <ul className="space-y-3 mb-5">
              {project.members.map((m) => (
                <li key={m._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Member avatar initial */}
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Admin badge for project creator */}
                    {String(m._id) === String(project.createdBy?._id) && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                        Admin
                      </span>
                    )}
                    {/* Remove button — admin only, not for themselves */}
                    {isAdmin && String(m._id) !== String(project.createdBy?._id) && (
                      <button
                        onClick={() => removeMember(m._id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-0.5 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Add member form — admin only */}
            {isAdmin && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Add Member by Email</p>
                <form onSubmit={addMember} className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="member@example.com"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
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

        {/* ── ACTIVITY TAB ── Chronological log of project actions */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
            <h2 className="font-semibold text-gray-800 mb-4">Activity Log</h2>
            {activity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((log) => (
                  <li key={log._id} className="flex items-start gap-3">
                    {/* User avatar initial */}
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {log.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{log.user?.name}</span> {log.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
