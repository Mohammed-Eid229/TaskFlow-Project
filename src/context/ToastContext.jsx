import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, variant = "success") => {
    setToast({ message, variant, id: Date.now() })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className={`tf-toast tf-toast--${toast.variant}`}
          role="status"
          key={toast.id}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
