// Utility functions for comment handling
import { formatRelativeTime } from './dateUtils'

/**
 * Format time ago with proper singular/plural forms using EET timezone
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time string
 */
export const timeAgo = (date) => {
  if (typeof date === 'string') {
    return formatRelativeTime(date)
  }
  return formatRelativeTime(date.toISOString())
}

/**
 * Get display name for user from various possible fields
 * @param {Object} user - User object
 * @param {Object} commentUser - Comment user data
 * @returns {string} Display name
 */
export const getUserDisplayName = (user, commentUser) => {
  return commentUser?.userName ?? 
         commentUser?.userFullName ?? 
         commentUser?.userDisplayName ?? 
         commentUser?.user?.email?.split('@')[0] ?? 
         commentUser?.user?.split('@')[0] ?? 
         user?.fullName ?? 
         (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ??
         user?.email?.split('@')[0] ?? 
         "User"
}

/**
 * Create notification data for comments
 * @param {string} taskId - Task ID
 * @param {string} taskTitle - Task title
 * @param {string} commentText - Comment text
 * @param {string} targetUserId - Target user ID
 * @returns {Object} Notification data
 */
export const createCommentNotification = (taskId, taskTitle, commentText, targetUserId) => {
  return {
    taskId,
    message: `New comment on task "${taskTitle}": "${commentText.trim().substring(0, 50)}${commentText.trim().length > 50 ? '...' : ''}"`,
    type: "comment",
    targetUserId
  }
}

/**
 * Create notification data for attachments
 * @param {string} taskId - Task ID
 * @param {string} taskTitle - Task title
 * @param {string} fileName - File name
 * @param {string} targetUserId - Target user ID
 * @returns {Object} Notification data
 */
export const createAttachmentNotification = (taskId, taskTitle, fileName, targetUserId) => {
  return {
    taskId,
    message: `New attachment "${fileName}" added to task "${taskTitle}"`,
    type: "attachment",
    targetUserId
  }
}

/**
 * Format comment data from API response
 * @param {Object} comment - Raw comment data
 * @param {Object} currentUser - Current user object
 * @returns {Object} Formatted comment data
 */
export const formatCommentData = (comment, currentUser) => {
  return {
    id: comment.id ?? comment.commentId,
    user: getUserDisplayName(currentUser, comment),
    text: comment.content ?? comment.text ?? "",
    time: comment.createdAt || new Date().toISOString(),
  }
}
