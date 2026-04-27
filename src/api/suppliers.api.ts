import { apiClient } from './client'
import type { ApiResponse, Supplier, SupplierProduct } from '../types'

interface CreateSupplierData {
  name: string
  contactPerson: string
  email: string
  phone: string
}

interface UpdateSupplierData extends CreateSupplierData {
  isActive: boolean
}

interface AddSupplierProductData {
  productId: string
  price: number
  currency: string
}

interface UpdateSupplierProductData {
  price: number
  currency: string
  isAvailable: boolean
}

export const suppliersApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Supplier[]>>('/suppliers').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`).then((r) => r.data),

  create: (data: CreateSupplierData) =>
    apiClient.post<ApiResponse<Supplier>>('/suppliers', data).then((r) => r.data),

  update: (id: string, data: UpdateSupplierData) =>
    apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/suppliers/${id}`).then((r) => r.data),

  getProducts: (supplierId: string) =>
    apiClient.get<ApiResponse<SupplierProduct[]>>(`/suppliers/${supplierId}/products`).then((r) => r.data),

  addProduct: (supplierId: string, data: AddSupplierProductData) =>
    apiClient.post<ApiResponse<SupplierProduct>>(`/suppliers/${supplierId}/products`, data).then((r) => r.data),

  updateProduct: (supplierId: string, id: string, data: UpdateSupplierProductData) =>
    apiClient.put<ApiResponse<SupplierProduct>>(`/suppliers/${supplierId}/products/${id}`, data).then((r) => r.data),

  removeProduct: (supplierId: string, id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/suppliers/${supplierId}/products/${id}`).then((r) => r.data),
}
