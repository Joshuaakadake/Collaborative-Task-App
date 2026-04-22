import { Link } from "react-router-dom";
import TaskItem from "./TaskItem";

export default function TaskList({ tasks }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Recent Tasks</h2>
        <Link
          to="/tasks"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}