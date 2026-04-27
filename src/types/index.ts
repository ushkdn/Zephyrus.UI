export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

// Auth
export type UserRole = 'Admin' | 'Manager' | 'Buyer'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  middleName: string
  lastName: string
  role: number
}

// Catalog
export interface Category {
  id: string
  name: string
  parentId: string | null
  dateCreated: string
}

export interface Product {
  id: string
  name: string
  unit: string
  categoryId: string
  isActive: boolean
}

export interface ProductDetail {
  id: string
  name: string
  description: string
  unit: string
  categoryId: string
  isActive: boolean
}

// Supplier
export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  isActive: boolean
}

export interface SupplierProduct {
  id: string
  supplierId: string
  productId: string
  price: number
  currency: string
  isAvailable: boolean
}

// Procurement
export type PurchaseRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Ordered'
export type OrderStatus = 'Created' | 'Confirmed' | 'Delivered' | 'Cancelled'

export interface PurchaseRequest {
  id: string
  productId: string
  quantity: number
  unit: string
  requestedBy: string
  status: PurchaseRequestStatus
  comment: string | null
  dateCreated: string
}

export interface Order {
  id: string
  purchaseRequestId: string
  supplierId: string
  productId: string
  quantity: number
  unitPrice: number
  currency: string
  totalPrice: number
  status: OrderStatus
  dateCreated: string
}

// Notification
export interface Notification {
  id: string
  recipientId: string
  title: string
  message: string
  type: string
  isRead: boolean
  dateCreated: string
}
