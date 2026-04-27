import { apiClient } from './client'
import type { ApiResponse, Category } from '../types'

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories').then((r) => r.data),

  create: (data: { name: string; parentId?: string | null }) =>
    apiClient.post<ApiResponse<Category>>('/categories', data).then((r) => r.data),

  update: (id: string, data: { name: string; parentId?: string | null }) =>
    apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/categories/${id}`).then((r) => r.data),
}
