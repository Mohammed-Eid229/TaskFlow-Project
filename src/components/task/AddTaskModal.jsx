import { useState } from "react"

export default function AddTaskModal({ isOpen, onClose, onAdd }) {

    const [title, setTitle] = useState("")
    const [priority, setPriority] = useState("medium")

    if (!isOpen) return null

    const handleSubmit = () => {

        if (!title) return

       onAdd(title,priority)

        setTitle("")

        onClose()

    }

    return (

        <div style={overlay}>

            <div style={modal}>

                <h2>Add Task</h2>

                <input
                    type="text"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={input}
                />
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={input}
                >

                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>

                </select>

                <div style={{ display: "flex", gap: "10px" }}>

                    <button onClick={handleSubmit} style={button}>
                        Add
                    </button>

                    <button onClick={onClose} style={cancel}>
                        Cancel
                    </button>

                </div>

            </div>

        </div>

    )

}

const overlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}

const modal = {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "300px"
}

const input = {
    width: "100%",
    padding: "8px",
    margin: "10px 0"
}

const button = {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px"
}

const cancel = {
    background: "gray",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px"
}