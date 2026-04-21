export default function TaskItem({ task }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          task.status === "completed" ? "bg-green-500" :
          task.status === "in-progress" ? "bg-yellow-500" :
          "bg-red-400"
        }`} />
        <span className="text-sm font-medium text-gray-700">
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          task.priority === "high" ? "bg-red-100 text-red-600" :
          task.priority === "medium" ? "bg-yellow-100 text-yellow-600" :
          "bg-gray-100 text-gray-500"
        }`}>
          {task.priority}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          task.status === "completed" ? "bg-green-100 text-green-600" :
          task.status === "in-progress" ? "bg-yellow-100 text-yellow-600" :
          "bg-red-100 text-red-500"
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}