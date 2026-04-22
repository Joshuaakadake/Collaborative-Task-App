export default function Button({ children, onClick, variant = 'primary' }) {
  const styles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition ${styles[variant]}`}
    >
      {children}
    </button>
  )
}