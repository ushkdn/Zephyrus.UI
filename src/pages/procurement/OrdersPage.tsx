import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const CURRENCIES = [
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KZT', label: 'KZT' },
]

interface ItemForm {
  purchaseRequestId: string
  unitPrice: string
  currency: string
}

const emptyItem = (): ItemForm => ({ purchaseRequestId: '', unitPrice: '', currency: 'RUB' })

export function OrdersPage() {
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => procurementApi.getAllOrders() })
  const { data: reqData } = useQuery({ queryKey: ['purchase-requests'], queryFn: () => procurementApi.getAllPurchaseRequests() })
  const { data: supData } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() })
  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })

  const orders = data?.data ?? []
  const allRequests = reqData?.data ?? []
  const suppliers = supData?.data ?? []
  const products = prodData?.data ?? []

  const approvedRequests = allRequests.filter((r) => r.status === 'Approved')
  const supplierOptions = suppliers.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))

  const usedRequestIds = new Set(items.map((i) => i.purchaseRequestId).filter(Boolean))

  function requestOptionsFor(index: number) {
    const currentId = items[index].purchaseRequestId
    return approvedRequests
      .filter((r) => r.id === currentId || !usedRequestIds.has(r.id))
      .map((r) => {
        const product = products.find((p) => p.id === r.productId)
        return { value: r.id, label: `${product?.name ?? 'Товар'} × ${r.quantity} ${r.unit}` }
      })
  }

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setSupplierId('')
    setItems([emptyItem()])
    setFormError(null)
  }

  const createMutation = useMutation({
    mutationFn: () => {
      if (!supplierId) throw new Error('Выберите поставщика')
      for (const item of items) {
        if (!item.purchaseRequestId) throw new Error('Выберите заявку для каждой позиции')
        if (!item.unitPrice || Number(item.unitPrice) <= 0) throw new Error('Цена должна быть больше 0')
        if (!item.currency) throw new Error('Укажите валюту')
      }
      return procurementApi.createOrder(supplierId, items.map((i) => ({
        purchaseRequestId: i.purchaseRequestId,
        unitPrice: Number(i.unitPrice),
        currency: i.currency,
      })))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['purchase-requests'] })
      setCreateOpen(false)
      resetForm()
    },
    onError: (e: Error) => setFormError(e.message),
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} записей</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }}>+ Создать заказ</Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Поставщик</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Позиций</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Сумма</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Статус</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет заказов</td></tr>
              )}
              {orders.map((o) => {
                const supplier = suppliers.find((s) => s.id === o.supplierId)
                const currencies = [...new Set(o.items.map((i) => i.currency))].join('/')
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{supplier?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.items.length}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {o.totalPrice.toLocaleString('ru')} {currencies}
                    </td>
                    <td className="px-4 py-3"><Badge label={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{new Date(o.dateCreated).toLocaleDateString('ru')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => setDetailOrder(o)}>Детали</Button>
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

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Новый заказ"
        onClose={() => { setCreateOpen(false); resetForm() }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); resetForm() }}>Отмена</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Создать</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Поставщик"
            options={supplierOptions}
            placeholder="Выберите поставщика"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Позиции заказа</span>
              <Button size="sm" variant="ghost" onClick={addItem}>+ Добавить позицию</Button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Позиция {i + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <Select
                    label="Заявка на закупку"
                    options={requestOptionsFor(i)}
                    placeholder="Выберите заявку"
                    value={item.purchaseRequestId}
                    onChange={(e) => updateItem(i, 'purchaseRequestId', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Цена за единицу"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Select
                        label="Валюта"
                        options={CURRENCIES}
                        value={item.currency}
                        onChange={(e) => updateItem(i, 'currency', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailOrder} title="Детали заказа" onClose={() => setDetailOrder(null)}>
        {detailOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Поставщик</p>
                <p className="font-medium text-gray-800">{suppliers.find((s) => s.id === detailOrder.supplierId)?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Статус</p>
                <Badge label={detailOrder.status} />
              </div>
              <div>
                <p className="text-gray-400">Итого</p>
                <p className="font-medium text-gray-800">{detailOrder.totalPrice.toLocaleString('ru')}</p>
              </div>
              <div>
                <p className="text-gray-400">Дата</p>
                <p className="font-medium text-gray-800">{new Date(detailOrder.dateCreated).toLocaleDateString('ru')}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Позиции</p>
              <div className="space-y-2">
                {detailOrder.items.map((item, i) => {
                  const req = allRequests.find((r) => r.id === item.purchaseRequestId)
                  const product = products.find((p) => p.id === req?.productId)
                  return (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700">{product?.name ?? '—'} {req ? `× ${req.quantity} ${req.unit}` : ''}</span>
                      <span className="font-medium text-gray-800">{item.totalPrice.toLocaleString('ru')} {item.currency}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
