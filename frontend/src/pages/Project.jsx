import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const STATUSES = ["todo", "inprogress", "done"];

const STATUS_LABEL = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
};

const STATUS_COLUMN = {
  todo: "bg-gray-50 border-gray-200",
  inprogress: "bg-blue-50 border-blue-200",
  done: "bg-green-50 border-green-200",
};

const PRIORITY_COLOR = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const PRIORITY_DOT = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

function TaskCard({ task, isAdmin, isAssigned, onStatusChange, onDelete, onDragStart }) {
  const canEdit = isAdmin || isAssigned;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, task._id)}
      className={`bg-white rounded-lg border p-3.5 shadow-sm cursor-grab ${
        isOverdue ? "border-red-300" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between mb-2">
        <p className="font-medium text-sm">{task.title}</p>
        <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLOR[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-2">{task.description}</p>
      )}

      <div className="flex justify-between text-xs">
        {task.assignedTo && <span>{task.assignedTo.name}</span>}
        {task.dueDate && (
          <span className={isOverdue ? "text-red-500" : "text-gray-400"}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-2 mt-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className="text-xs border px-2 py-1"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button onClick={() => onDelete(task._id)} className="text-red-500 text-xs">
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

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const dragTaskId = useRef(null);

  const isAdmin = project?.members?.some(
    (m) => String(m.user?._id) === user?._id && m.role === "admin"
  );

  // ✅ FIXED API CALLS
  const loadProject = () =>
    API.get(`/api/projects/${id}`).then((res) => setProject(res.data));

  const loadTasks = () =>
    API.get(`/api/tasks/${id}`).then((res) => setTasks(res.data));

  const loadActivity = () =>
    API.get(`/api/activity/${id}`).then((res) => setActivity(res.data));

  useEffect(() => {
    loadProject();
    loadTasks();
    loadActivity();
  }, [id]);

  const createTask = async (form) => {
    await API.post("/api/tasks", { ...form, project: id });
    loadTasks();
  };

  const updateStatus = async (taskId, status) => {
    await API.put(`/api/tasks/${taskId}`, { status });
    loadTasks();
  };

  const deleteTask = async (taskId) => {
    await API.delete(`/api/tasks/${taskId}`);
    loadTasks();
  };

  const onDragStart = (e, taskId) => {
    dragTaskId.current = taskId;
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    updateStatus(dragTaskId.current, status);
  };

  if (!project) return <div>Loading...</div>;

  const grouped = { todo: [], inprogress: [], done: [] };
  tasks.forEach((t) => grouped[t.status]?.push(t));

  return (
    <div>
      <Navbar />

      <h1>{project.name}</h1>

      {isAdmin && <button onClick={() => setShowModal(true)}>Add Task</button>}

      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <div key={status} onDrop={(e) => onDrop(e, status)} onDragOver={(e) => e.preventDefault()}>
            <h2>{STATUS_LABEL[status]}</h2>

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
        ))}
      </div>

      {showModal && (
        <TaskModal
          members={project.members.map((m) => m.user)}
          onClose={() => setShowModal(false)}
          onSave={createTask}
        />
      )}
    </div>
  );
}