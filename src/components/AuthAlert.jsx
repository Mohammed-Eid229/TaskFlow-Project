/**
 * @param {{ title?: string, detail?: string } | string | null} message
 */
export default function AuthAlert({ message, variant = "error" }) {
  if (!message) return null

  const title = typeof message === "string" ? message : message.title
  const detail = typeof message === "string" ? null : message.detail

  if (!title) return null

  const className =
    variant === "success"
      ? "auth-alert auth-alert--success"
      : "auth-alert"

  return (
    <div className={className} role={variant === "success" ? "status" : "alert"}>
      <div className="auth-alert__title">{title}</div>
      {detail ? <div className="auth-alert__detail">{detail}</div> : null}
    </div>
  )
}
