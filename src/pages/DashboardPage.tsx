import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { ROLE_LABELS } from '../types'
import { categoriesApi } from '../api/categories.api'
import { productsApi } from '../api/products.api'
import { suppliersApi } from '../api/suppliers.api'
import { procurementApi } from '../api/procurement.api'
import { Badge } from '../components/ui/Badge'

function StatCard({ label, value, to, color }: { label: string; value: number; to: string; color: string }) {
  return (
    <Link to={to} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white text-xl font-bold`}>
        {value}
      </div>
      <span className="text-gray-700 font-medium">{label}</span>
    </Link>
  )
}

export function DashboardPage() {
  const { user, hasRole } = useAuthStore()

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() })
  const { data: requests } = useQuery({
    queryKey: ['purchase-requests'],
    queryFn: () => procurementApi.getAllPurchaseRequests(),
    enabled: hasRole('Admin', 'Manager'),
  })
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => procurementApi.getAllOrders(),
    enabled: hasRole('Admin', 'Manager'),
  })

  const pendingRequests = requests?.data?.filter((r) => r.status === 'Pending') ?? []
  const activeOrders = orders?.data?.filter((o) => o.status === 'Created' || o.status === 'Confirmed') ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать{user?.firstName ? `, ${user.firstName} ${user.lastName}` : ''}!</h1>
        <p className="text-sm text-gray-500 mt-1">Роль: <span className="font-medium text-indigo-600">{user?.role ? ROLE_LABELS[user.role] : ''}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Категории" value={categories?.data?.length ?? 0} to="/categories" color="bg-indigo-500" />
        <StatCard label="Товары" value={products?.data?.length ?? 0} to="/products" color="bg-blue-500" />
        <StatCard label="Поставщики" value={suppliers?.data?.length ?? 0} to="/suppliers" color="bg-violet-500" />
        <StatCard label="Заявки" value={requests?.data?.length ?? 0} to="/purchase-requests" color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasRole('Admin', 'Manager') && pendingRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Ожидают рассмотрения</h2>
              <Link to="/purchase-requests" className="text-sm text-indigo-600 hover:underline">Все заявки</Link>
            </div>
            <ul className="space-y-2">
              {pendingRequests.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 font-mono">{r.id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{r.quantity} {r.unit}</span>
                    <Badge label={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasRole('Admin', 'Manager') && activeOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Активные заказы</h2>
              <Link to="/orders" className="text-sm text-indigo-600 hover:underline">Все заказы</Link>
            </div>
            <ul className="space-y-2">
              {activeOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 font-mono">{o.id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{o.totalPrice.toLocaleString()} {o.currency}</span>
                    <Badge label={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
