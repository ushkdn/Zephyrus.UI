import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { CategoriesPage } from './pages/categories/CategoriesPage'
import { ProductsPage } from './pages/products/ProductsPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage'
import { PurchaseRequestsPage } from './pages/procurement/PurchaseRequestsPage'
import { OrdersPage } from './pages/procurement/OrdersPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'


const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'suppliers/:id', element: <SupplierDetailPage /> },
      { path: 'purchase-requests', element: <PurchaseRequestsPage /> },
      {
        path: 'orders',
        element: (
          <ProtectedRoute roles={['Admin', 'Manager']}>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
