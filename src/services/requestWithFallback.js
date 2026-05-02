import api from "./api"

export async function requestWithFallback(candidates) {
  let lastError = null

  for (const candidate of candidates) {
    try {
      const method = candidate.method || "get"
      if (method === "get" || method === "delete") {
        return await api[method](candidate.url, candidate.config)
      }
      return await api[method](candidate.url, candidate.data, candidate.config)
    } catch (error) {
      // Retry with alternative endpoint shape on 404/405 only.
      const status = error?.response?.status
      if (status === 404 || status === 405) {
        lastError = error
        continue
      }
      throw error
    }
  }

  if (lastError) throw lastError
  throw new Error("No API endpoint candidates were provided.")
}

