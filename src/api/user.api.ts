import { apiClient } from './client'
import type { ApiResponse, UserProfile } from '../types'

export const userApi = {
  getById: (id: string) =>
    apiClient.get<ApiResponse<UserProfile>>(`/users/${id}`).then((r) => r.data),
}
