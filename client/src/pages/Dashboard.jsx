import { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext";
import StatsGrid from "../components/StatsGrid";
import TaskList from "../components/TaskList";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { initialTasks } from "../data/tasks";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500)
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="max-w-5xl mx-auto p-4 md:p-8">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your tasks today.
          </p>
        </div>

        {/* Stats */}
        <StatsGrid tasks={initialTasks} />

        {/* Task List */}
        <TaskList tasks={initialTasks} />

      </div>
    </div>
  );
}