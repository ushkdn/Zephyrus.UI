import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { procurementApi } from '../../api/procurement.api'
import { productsApi } from '../../api/products.api'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { PurchaseRequest } from '../../types'

const schema = z.object({
  productId: z.string().min(1, 'Выберите товар'),
  quantity: z.coerce.number().positive('Количество должно быть > 0'),
})

type FormData = z.infer<typeof schema>

const rejectSchema = z.object({ comment: z.string().min(1, 'Введите причину') })
type RejectData = z.infer<typeof rejectSchema>

export function PurchaseRequestsPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const isManager = hasRole('Admin', 'Manager')

  const [createOpen, setCreateOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<PurchaseRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', isManager ? 'all' : 'my'],
    queryFn: () => isManager
      ? procurementApi.getAllPurchaseRequests()
      : procurementApi.getMyPurchaseRequests(),
  })
  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })

  const requests = data?.data ?? []
  const products = prodData?.data ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const { register: regReject, handleSubmit: handleReject, reset: resetReject, formState: { errors: rejectErrors } } = useForm<RejectData>({ resolver: zodResolver(rejectSchema) })

  const createMutation = useMutation({
    mutationFn: (d: FormData) =>
      procurementApi.createPurchaseRequest({ productId: d.productId, quantity: d.quantity }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setCreateOpen(false); reset() },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => procurementApi.approvePurchaseRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-requests'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: RejectData }) => procurementApi.rejectPurchaseRequest(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setRejectTarget(null); resetReject() },
  })

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.unit})` }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заявки на закупку</h1>
          <p className="text-sm text-gray-500 mt-0.5">{requests.length} записей</p>
        </div>
        {!isManager && <Button onClick={() => setCreateOpen(true)}>+ Создать заявку</Button>}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Товар</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Кол-во</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Статус</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Комментарий</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Дата</th>
                {isManager && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.length === 0 && (
                <tr><td colSpan={isManager ? 6 : 5} className="px-4 py-8 text-center text-gray-400">Нет заявок</td></tr>
              )}
              {requests.map((r) => {
                const product = products.find((p) => p.id === r.productId)
                const isPending = r.status === 'Pending'
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{product?.name ?? r.productId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.quantity} {product?.unit ?? ''}</td>
                    <td className="px-4 py-3"><Badge label={r.status} /></td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{r.comment ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.dateCreated).toLocaleDateString('ru')}</td>
                    {isManager && (
                      <td className="px-4 py-3">
                        {isPending && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="primary"
                              loading={approveMutation.isPending && approveMutation.variables === r.id}
                              onClick={() => approveMutation.mutate(r.id)}
                            >
                              Одобрить
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => { setRejectTarget(r); resetReject() }}>
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={createOpen}
        title="Новая заявка на закупку"
        onClose={() => { setCreateOpen(false); reset() }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button form="pr-form" type="submit" loading={isSubmitting || createMutation.isPending}>Создать</Button>
          </>
        }
      >
        <form id="pr-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select label="Товар" options={productOptions} placeholder="Выберите товар" error={errors.productId?.message} {...register('productId')} />
          <Input label="Количество" type="number" step="0.01" placeholder="0" error={errors.quantity?.message} {...register('quantity')} />
        </form>
      </Modal>

      <Modal
        open={!!rejectTarget}
        title="Отклонить заявку"
        onClose={() => { setRejectTarget(null); resetReject() }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>Отмена</Button>
            <Button form="rej-form" type="submit" variant="danger" loading={rejectMutation.isPending}>Отклонить</Button>
          </>
        }
      >
        <form
          id="rej-form"
          onSubmit={handleReject((d) => { if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, d }) })}
          className="space-y-4"
        >
          <Input label="Причина отказа" placeholder="Укажите причину" error={rejectErrors.comment?.message} {...regReject('comment')} />
        </form>
      </Modal>
    </div>
  )
}
