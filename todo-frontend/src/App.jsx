import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const LEVEL_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Blocked', 'Done']

const levelClasses = (lvl) => ({
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200'
}[lvl] || 'bg-slate-50 text-slate-700 border-slate-200')

const statusClasses = (val) => ({
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Blocked: 'bg-amber-50 text-amber-800 border-amber-200',
  Done: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}[val] || 'bg-slate-100 text-slate-700 border-slate-200')

const ownerClasses = (name) => {
  const palette = [
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'bg-lime-50 text-lime-700 border-lime-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-pink-50 text-pink-700 border-pink-200',
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-orange-50 text-orange-700 border-orange-200',
  ]
  const key = (name || 'Unassigned').trim().toLowerCase()
  const sum = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const idx = Math.abs(sum) % palette.length
  return palette[idx]
}

export default function App() {
  const [tasks, setTasks] = useState([])

  // Hardcoded initial suggestions — user can still type anything else
  const suggestedOwners = ['Unassigned', 'Alice', 'Bob', 'Charlie', 'Design', 'QA', 'Frontend', 'Backend']

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [level, setLevel] = useState('Medium')
  const [status, setStatus] = useState('Not Started')
  const [owner, setOwner] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editLevel, setEditLevel] = useState('Medium')
  const [editStatus, setEditStatus] = useState('Not Started')
  const [editOwner, setEditOwner] = useState('')

  const inputRef = useRef(null)

  const API = 'http://localhost:8080/api/tasks'

  useEffect(() => {
    fetchTasks()

    const handleGlobalKeys = (e) => {
      if (e.key === 'Escape' && editingId) {
        cancelEditing()
      }
    }

    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [editingId])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(API)
      setTasks(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Could not load tasks')
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e?.preventDefault()
    if (!title.trim()) return

    try {
      await axios.post(API, {
        title: title.trim(),
        completed: false,
        dueDate: dueDate || null,
        level,
        status,
        owner: owner.trim() || 'Unassigned'
      })
      setTitle('')
      setDueDate('')
      setLevel('Medium')
      setStatus('Not Started')
      setOwner('')
      fetchTasks()
    } catch (err) {
      console.error(err)
      setError('Could not create task')
    }
  }

  const toggleTask = async (id) => {
    try {
      await axios.put(`${API}/${id}/toggle`)
      fetchTasks()
    } catch (err) {
      setError('Could not update task')
    }
  }

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API}/${id}`)
      fetchTasks()
    } catch (err) {
      setError('Could not delete task')
    }
  }

  const startEditing = (task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDueDate(task.dueDate || '')
    setEditLevel(task.level || 'Medium')
    setEditStatus(task.status || 'Not Started')
    setEditOwner(task.owner || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const saveEdit = async (task) => {
    if (!editTitle.trim()) return
    try {
      await axios.put(`${API}/${task.id}`, {
        title: editTitle.trim(),
        completed: task.completed,
        dueDate: editDueDate || null,
        level: editLevel,
        status: editStatus,
        owner: editOwner.trim() || 'Unassigned'
      })
      cancelEditing()
      fetchTasks()
    } catch (err) {
      console.error(err)
      setError('Could not update task')
    }
  }

  const formatFriendlyDate = (dateString) => {
    if (!dateString) return 'No date'
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const target = new Date(dateString)
    const diff = Math.floor((target - todayStart) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(target)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  const overdueTasks  = activeTasks.filter(t => t.dueDate && t.dueDate < todayStr)
  const todayTasks    = activeTasks.filter(t => t.dueDate === todayStr)
  const upcomingTasks = activeTasks.filter(t => t.dueDate && t.dueDate > todayStr)
  const noDateTasks   = activeTasks.filter(t => !t.dueDate)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">

        <header className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            ✓
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="ml-auto text-sm text-slate-600 font-medium">
            {activeTasks.length} active • {completedTasks.length} done
          </div>
        </header>

        <form onSubmit={addTask} className="mb-10">
          <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="w-6 h-6 mt-1.5 rounded-full border-2 border-slate-300 flex-shrink-0" />

            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Add a new task... (press Enter to save)"
              className="flex-1 min-w-[220px] bg-transparent outline-none text-base placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addTask(e)
                }
              }}
            />

            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2"
            />

            <select value={level} onChange={e => setLevel(e.target.value)} className="text-sm border rounded-lg px-3 py-2 bg-white">
              {LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm border rounded-lg px-3 py-2 bg-white">
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="Owner / assignee"
              className="text-sm border rounded-lg px-3 py-2 min-w-[160px] placeholder:text-slate-400"
              list="owner-suggestions"
            />
            <datalist id="owner-suggestions">
              {suggestedOwners.map(name => <option key={name} value={name} />)}
            </datalist>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            {error}
          </div>
        )}

        {/* No more "Manage suggested owners" link */}

        <section className="space-y-10">
          <TaskGroup title="Overdue" tasks={overdueTasks} empty="No overdue tasks" {...{ editingId, editTitle, setEditTitle, editDueDate, setEditDueDate, editLevel, setEditLevel, editStatus, setEditStatus, editOwner, setEditOwner, startEditing, cancelEditing, saveEdit, toggleTask, deleteTask, formatFriendlyDate }} />
          <TaskGroup title="Today" tasks={todayTasks} empty="Nothing due today" {...{ editingId, editTitle, setEditTitle, editDueDate, setEditDueDate, editLevel, setEditLevel, editStatus, setEditStatus, editOwner, setEditOwner, startEditing, cancelEditing, saveEdit, toggleTask, deleteTask, formatFriendlyDate }} />
          <TaskGroup title="Upcoming" tasks={upcomingTasks} empty="No upcoming tasks" {...{ editingId, editTitle, setEditTitle, editDueDate, setEditDueDate, editLevel, setEditLevel, editStatus, setEditStatus, editOwner, setEditOwner, startEditing, cancelEditing, saveEdit, toggleTask, deleteTask, formatFriendlyDate }} />
          <TaskGroup title="No due date" tasks={noDateTasks} empty="No unscheduled tasks" {...{ editingId, editTitle, setEditTitle, editDueDate, setEditDueDate, editLevel, setEditLevel, editStatus, setEditStatus, editOwner, setEditOwner, startEditing, cancelEditing, saveEdit, toggleTask, deleteTask, formatFriendlyDate }} />
        </section>

        <section className="mt-12">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-slate-500 mb-4">Completed</h2>
          {completedTasks.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No completed tasks yet</p>
          ) : (
            <div className="space-y-1">
              {completedTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  {...{ editingId, editTitle, setEditTitle, editDueDate, setEditDueDate, editLevel, setEditLevel, editStatus, setEditStatus, editOwner, setEditOwner, startEditing, cancelEditing, saveEdit, toggleTask, deleteTask, formatFriendlyDate }}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}

function TaskRow({
  task,
  editingId,
  editTitle, setEditTitle,
  editDueDate, setEditDueDate,
  editLevel, setEditLevel,
  editStatus, setEditStatus,
  editOwner, setEditOwner,
  startEditing,
  cancelEditing,
  saveEdit,
  toggleTask,
  deleteTask,
  formatFriendlyDate
}) {
  const isEditing = editingId === task.id

  return (
    <div className={`group flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition ${isEditing ? 'bg-blue-50/40' : ''}`}>
      <button
        onClick={() => toggleTask(task.id)}
        className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-slate-400'}`}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-wrap gap-2.5 items-center">
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="flex-1 min-w-[240px] px-3 py-2 border border-blue-300 rounded-lg text-base outline-none focus:border-blue-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  saveEdit(task)
                }
                if (e.key === 'Escape') cancelEditing()
              }}
            />
            <input
              type="date"
              value={editDueDate}
              onChange={e => setEditDueDate(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2"
            />
            <select value={editLevel} onChange={e => setEditLevel(e.target.value)} className="text-sm border rounded-lg px-3 py-2">
              {LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="text-sm border rounded-lg px-3 py-2">
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              type="text"
              value={editOwner}
              onChange={e => setEditOwner(e.target.value)}
              placeholder="Owner / assignee"
              className="text-sm border rounded-lg px-3 py-2 min-w-[160px]"
            />
            <div className="flex gap-4 mt-2 sm:mt-0">
              <button onClick={() => saveEdit(task)} className="text-green-600 hover:text-green-800 font-medium">Save</button>
              <button onClick={cancelEditing} className="text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <p
              className={`text-[15px] leading-relaxed cursor-text break-words ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}
              onDoubleClick={() => startEditing(task)}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap gap-2 justify-end items-center">
              <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600">
                {formatFriendlyDate(task.dueDate)}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${levelClasses(task.level)}`}>
                {task.level}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusClasses(task.status)}`}>
                {task.status}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ownerClasses(task.owner)}`}>
                {task.owner || 'Unassigned'}
              </span>
              <button
                onClick={() => startEditing(task)}
                className="opacity-0 group-hover:opacity-70 text-blue-600 text-xs font-medium"
              >
                edit
              </button>
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-70 hover:text-red-600 text-slate-400 text-sm"
        >
          Delete
        </button>
      )}
    </div>
  )
}

function TaskGroup({ title, tasks, empty, ...props }) {
  return (
    <div>
      <h2 className="text-sm uppercase tracking-wider font-semibold text-slate-500 mb-3">{title}</h2>
      {tasks.length === 0 ? (
        <div className="text-slate-400 text-sm py-4 pl-2">{empty}</div>
      ) : (
        <div className="space-y-1">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} {...props} />
          ))}
        </div>
      )}
    </div>
  )
}