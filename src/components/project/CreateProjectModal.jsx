import { useState } from "react"

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {

  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")

  if(!isOpen) return null

  const handleSubmit = () => {

    if(!title) return

    onCreate(title,description)

    setTitle("")
    setDescription("")

    onClose()

  }

  return (

    <div style={overlay}>

      <div style={modal}>

        <h2>Create Project</h2>

        <input
          type="text"
          placeholder="Project title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          style={input}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          style={textarea}
        />

        <div style={{display:"flex",gap:"10px"}}>

          <button onClick={handleSubmit} style={createBtn}>
            Create
          </button>

          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>

        </div>

      </div>

    </div>

  )

}

const overlay = {
  position:"fixed",
  top:0,
  left:0,
  width:"100%",
  height:"100%",
  background:"rgba(0,0,0,0.4)",
  display:"flex",
  alignItems:"center",
  justifyContent:"center"
}

const modal = {
  background:"white",
  padding:"20px",
  borderRadius:"10px",
  width:"350px"
}

const input = {
  width:"100%",
  padding:"8px",
  margin:"10px 0"
}

const textarea = {
  width:"100%",
  padding:"8px",
  marginBottom:"10px"
}

const createBtn = {
  background:"#2563eb",
  color:"white",
  border:"none",
  padding:"8px 15px",
  borderRadius:"5px"
}

const cancelBtn = {
  background:"gray",
  color:"white",
  border:"none",
  padding:"8px 15px",
  borderRadius:"5px"
}