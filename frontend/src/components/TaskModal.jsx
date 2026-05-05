import { useState } from "react";

export default function TaskModal({ members, onClose, onSave }) {
  // Local form state for the new task fields
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });
  const [loading, setLoading] = useState(false);

  // Submit handler: calls parent onSave with form data
  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <div className="modal-header">
          <h2 className="text-base font-semibold text-gray-800">Create New Task</h2>
          <button onClick={onClose} className="modal-close">
            Close
          </button>
        </div>

        <form onSubmit={handle} className="modal-body space-y-4">

          {/* Title field (required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              className="input-field"
              placeholder="Task title"
              required
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Optional description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="input-field resize-none"
              placeholder="Optional description"
              rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Due date and priority - stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                className="input-field"
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              {/* defaultValue sets the initial selection without making it controlled */}
              <select
                defaultValue="medium"
                className="input-field"
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assign task to a project member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
            <select
              className="input-field"
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons - stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-60 transition-colors"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
