import { useState } from "react";
import TaskItem from "../components/TaskItem";
import Toast from "../components/Toast.jsx";
import { initialTasks } from "../data/tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", status: "pending", priority: "medium" });
  const [toast, setToast] = useState(null);

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("Please enter a task title", "error");
      return;
    }
    if (editTask) {
      setTasks(tasks.map(t => t.id === editTask.id ? { ...t, ...form } : t));
      setEditTask(null);
      showToast("Task updated successfully!");
    } else {
      setTasks([...tasks, { id: Date.now(), ...form }]);
      showToast("Task created successfully!");
    }
    setForm({ title: "", status: "pending", priority: "medium" });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    showToast("Task deleted", "error");
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, status: task.status, priority: task.priority });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Tasks 📋</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditTask(null); setForm({ title: "", status: "pending", priority: "medium" }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            + Add Task
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-700 dark:text-white mb-4">
              {editTask ? "Edit Task" : "New Task"}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title..."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex gap-3">
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editTask ? "Save Changes" : "Add Task"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditTask(null); }}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["all", "pending", "in-progress", "completed"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {f === "all" ? "All" :
               f === "in-progress" ? "In Progress" :
               f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center text-gray-400">
              No tasks found 🎉
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow px-4 py-3 flex items-center justify-between">
                <TaskItem task={task} />
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}