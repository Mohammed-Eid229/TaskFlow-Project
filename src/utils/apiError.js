/**
 * Structured API errors for alerts: short title + optional detail.
 */
export function getApiErrorParts(err, fallback = "Something went wrong") {
  if (!err) return { title: fallback }

  // Thrown Error (e.g. missing token in response) — not axios
  if (!err.isAxiosError && err.message) {
    return { title: err.message }
  }

  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    const base =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
    return {
      title: "Can't connect to the server",
      detail: `Start your .NET API, set VITE_API_BASE_URL in .env if the URL differs, and enable CORS for this origin. Trying: ${base}`,
    }
  }

  if (err.response?.status === 401) {
  return {
    title: "Invalid email or password.",
  }
}

  if (err.code === "ECONNABORTED") {
    return {
      title: "Request timed out",
      detail: "Check your connection and try again.",
    }
  }

  const data = err.response?.data
  if (typeof data === "string" && data.trim()) {
    return { title: data.trim() }
  }

  if (data?.message) return { title: String(data.message) }
  if (data?.title) return { title: String(data.title) }

  if (data?.errors && typeof data.errors === "object") {
    const parts = Object.values(data.errors).flat().filter(Boolean)
    if (parts.length) return { title: parts.join(" ") }
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    return { title: data.errors.join(" ") }
  }

  if (err.response?.status === 404) {
    return {
      title: "API endpoint not found",
      detail:
        "Confirm your backend route matches the frontend (e.g. POST /api/auth/register).",
    }
  }

  if (err.response?.status === 0) {
    return {
      title: "No response from server",
      detail: "The request may be blocked or the server is offline.",
    }
  }

  if (typeof err.message === "string" && err.message !== "Network Error") {
    return { title: err.message }
  }

  return { title: fallback }
}

/** @deprecated use getApiErrorParts for UI; kept for simple string consumers */
export function formatApiError(err, fallback) {
  const { title, detail } = getApiErrorParts(err, fallback)
  return detail ? `${title} ${detail}` : title
}
