import StatCard from "./StatCard";

export default function StatsGrid({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const pending = tasks.filter(t => t.status === "pending").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total Tasks" value={total} color="border-blue-500" />
      <StatCard label="Completed" value={completed} color="border-green-500" />
      <StatCard label="In Progress" value={inProgress} color="border-yellow-500" />
      <StatCard label="Pending" value={pending} color="border-red-400" />
    </div>
  );
}