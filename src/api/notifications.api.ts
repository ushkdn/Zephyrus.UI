import { apiClient } from './client'
import type { ApiResponse, Notification } from '../types'

export const notificationsApi = {
  getByRecipient: (recipientId: string) =>
    apiClient.get<ApiResponse<Notification[]>>(`/notifications/${recipientId}`).then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<{ id: string }>>(`/notifications/${id}/read`).then((r) => r.data),
}
