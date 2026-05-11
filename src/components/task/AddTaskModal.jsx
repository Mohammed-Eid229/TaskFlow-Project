import { useState } from "react"

export default function AddTaskModal({ isOpen, onClose, onAdd, assignees = [] }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
    })
    setTitle("")
    setDescription("")
    setPriority("medium")
    setDueDate("")
    setAssignedTo("")
    onClose()
  }

  return (
    <div className="tf-dialog-root" role="presentation">
      <button type="button" className="tf-dialog-backdrop" aria-label="Close" onClick={onClose} />
      <div className="tf-dialog" role="dialog" aria-modal="true">
        <h2 className="tf-dialog-title">Add Task</h2>
        <div className="admin-form">
          <label className="auth-label">
            Task title
            <input type="text" className="form-control" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="auth-label">
            Description
            <textarea className="form-control" rows={3} placeholder="Task description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="auth-label">
            Priority
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
                    <label className="auth-label">
            Due date
            <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <div className="tf-dialog-actions tf-dialog-actions--form">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim()}>Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}