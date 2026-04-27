import { apiClient } from './client'
import type { ApiResponse, Product } from '../types'

interface CreateProductData {
  name: string
  description: string
  unit: string
  categoryId: string
}

interface UpdateProductData extends CreateProductData {
  isActive: boolean
}

export const productsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Product[]>>('/products').then((r) => r.data),

  create: (data: CreateProductData) =>
    apiClient.post<ApiResponse<Product>>('/products', data).then((r) => r.data),

  update: (id: string, data: UpdateProductData) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/products/${id}`).then((r) => r.data),
}
