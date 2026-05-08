import { apiClient } from './client'
import type { ApiResponse, PurchaseRequest, Order } from '../types'

interface CreatePurchaseRequestData {
  productId: string
  quantity: number
  unit: string
}

interface OrderItemData {
  purchaseRequestId: string
  unitPrice: number
  currency: string
}

interface RejectData {
  comment: string
}

export const procurementApi = {
  getAllPurchaseRequests: () =>
    apiClient.get<ApiResponse<PurchaseRequest[]>>('/purchase-requests').then((r) => r.data),

  getPurchaseRequestById: (id: string) =>
    apiClient.get<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`).then((r) => r.data),

  createPurchaseRequest: (data: CreatePurchaseRequestData) =>
    apiClient.post<ApiResponse<PurchaseRequest>>('/purchase-requests', data).then((r) => r.data),

  approvePurchaseRequest: (id: string) =>
    apiClient.patch<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}/approve`).then((r) => r.data),

  rejectPurchaseRequest: (id: string, data: RejectData) =>
    apiClient.patch<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}/reject`, data).then((r) => r.data),

  getAllOrders: () =>
    apiClient.get<ApiResponse<Order[]>>('/orders').then((r) => r.data),

  getOrderById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`).then((r) => r.data),

  createOrder: (supplierId: string, items: OrderItemData[]) =>
    apiClient.post<ApiResponse<Order>>('/orders', { supplierId, items }).then((r) => r.data),

  confirmOrder: (id: string) =>
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/confirm`).then((r) => r.data),

  deliverOrder: (id: string) =>
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/deliver`).then((r) => r.data),

  cancelOrder: (id: string) =>
    apiClient.patch<ApiResponse<Order>>(`/orders/${id}/cancel`).then((r) => r.data),
}
