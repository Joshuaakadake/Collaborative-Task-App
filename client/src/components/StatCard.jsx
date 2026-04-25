export default function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
    </div>
  )
}