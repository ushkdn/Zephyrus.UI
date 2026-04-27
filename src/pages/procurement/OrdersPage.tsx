import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { procurementApi } from '../../api/procurement.api'
import { suppliersApi } from '../../api/suppliers.api'
import { productsApi } from '../../api/products.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { Order } from '../../types'

const schema = z.object({
  purchaseRequestId: z.string().min(1, 'Выберите заявку'),
  supplierId: z.string().min(1, 'Выберите поставщика'),
  unitPrice: z.coerce.number().positive('Цена должна быть > 0'),
  currency: z.string().min(1, 'Введите валюту'),
})

type FormData = z.infer<typeof schema>

const currencyOptions = [
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KZT', label: 'KZT' },
]

export function OrdersPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => procurementApi.getAllOrders() })
  const { data: reqData } = useQuery({ queryKey: ['purchase-requests'], queryFn: () => procurementApi.getAllPurchaseRequests() })
  const { data: supData } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() })
  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })

  const orders = data?.data ?? []
  const allRequests = reqData?.data ?? []
  const suppliers = supData?.data ?? []
  const products = prodData?.data ?? []

  const approvedRequests = allRequests.filter((r) => r.status === 'Approved')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'RUB' },
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => procurementApi.createOrder({ purchaseRequestId: d.purchaseRequestId, supplierId: d.supplierId, unitPrice: d.unitPrice, currency: d.currency }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); setCreateOpen(false); reset() },
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => procurementApi.confirmOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const deliverMutation = useMutation({
    mutationFn: (id: string) => procurementApi.deliverOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => procurementApi.cancelOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const requestOptions = approvedRequests.map((r) => {
    const p = products.find((p) => p.id === r.productId)
    return { value: r.id, label: `${p?.name ?? 'Товар'} × ${r.quantity} ${r.unit}` }
  })

  const supplierOptions = suppliers.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} записей</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); reset() }}>+ Создать заказ</Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Поставщик</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Товар</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Кол-во</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Сумма</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Статус</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Нет заказов</td></tr>
              )}
              {orders.map((o) => {
                const supplier = suppliers.find((s) => s.id === o.supplierId)
                const product = products.find((p) => p.id === o.productId)
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{supplier?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{product?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.quantity}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.totalPrice.toLocaleString('ru')} {o.currency}</td>
                    <td className="px-4 py-3"><Badge label={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{new Date(o.dateCreated).toLocaleDateString('ru')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {o.status === 'Created' && (
                          <>
                            <Button size="sm" variant="primary" loading={confirmMutation.isPending && confirmMutation.variables === o.id} onClick={() => confirmMutation.mutate(o.id)}>Подтвердить</Button>
                            <Button size="sm" variant="danger" loading={cancelMutation.isPending && cancelMutation.variables === o.id} onClick={() => { if (confirm('Отменить заказ?')) cancelMutation.mutate(o.id) }}>Отменить</Button>
                          </>
                        )}
                        {o.status === 'Confirmed' && (
                          <>
                            <Button size="sm" variant="primary" loading={deliverMutation.isPending && deliverMutation.variables === o.id} onClick={() => deliverMutation.mutate(o.id)}>Доставлен</Button>
                            <Button size="sm" variant="danger" loading={cancelMutation.isPending && cancelMutation.variables === o.id} onClick={() => { if (confirm('Отменить заказ?')) cancelMutation.mutate(o.id) }}>Отменить</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={createOpen}
        title="Новый заказ"
        onClose={() => { setCreateOpen(false); reset() }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button form="order-form" type="submit" loading={isSubmitting || createMutation.isPending}>Создать</Button>
          </>
        }
      >
        <form id="order-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select label="Одобренная заявка" options={requestOptions} placeholder="Выберите заявку" error={errors.purchaseRequestId?.message} {...register('purchaseRequestId')} />
          <Select label="Поставщик" options={supplierOptions} placeholder="Выберите поставщика" error={errors.supplierId?.message} {...register('supplierId')} />
          <Input label="Цена за единицу" type="number" step="0.01" placeholder="0.00" error={errors.unitPrice?.message} {...register('unitPrice')} />
          <Select label="Валюта" options={currencyOptions} error={errors.currency?.message} {...register('currency')} />
        </form>
      </Modal>

      {/* Detail modal placeholder */}
      <Modal open={!!detailOrder} title="Детали заказа" onClose={() => setDetailOrder(null)}>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(detailOrder, null, 2)}</pre>
      </Modal>
    </div>
  )
}
