/**
 * Ensures a date string is treated as UTC by appending 'Z' if missing.
 * This is crucial because .NET often sends ISO strings without 'Z', 
 * causing browsers to parse them as local time.
 */
export function ensureUTC(dateString) {
  if (!dateString) return ""
  if (typeof dateString !== 'string') return dateString
  
  // If it already has timezone info, return as is
  if (dateString.includes('Z') || dateString.includes('+') || (dateString.includes('-') && dateString.length > 10 && dateString.split('-').length > 3)) {
    return dateString
  }
  
  // Append Z to force UTC parsing
  return `${dateString}Z`
}

/**
 * Formats a date string for display in the user's local timezone (e.g., Egypt Time).
 * It automatically handles DST (EET/EEST).
 */
export function formatDisplayDate(dateString) {
  if (!dateString) return "—"
  try {
    const utcString = ensureUTC(dateString)
    const date = new Date(utcString)
    
    if (isNaN(date.getTime())) return dateString

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return dateString
  }
}

/**
 * Calculates relative time (e.g., "5 mins ago") correctly by comparing UTC values.
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return ""
  try {
    const utcString = ensureUTC(dateString)
    const date = new Date(utcString)
    const now = new Date()
    
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return ""
  }
}
