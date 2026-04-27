import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { suppliersApi } from '../../api/suppliers.api'
import { productsApi } from '../../api/products.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { SupplierProduct } from '../../types'

const schema = z.object({
  productId: z.string().min(1, 'Выберите товар'),
  price: z.coerce.number().positive('Цена должна быть больше 0'),
  currency: z.string().min(1, 'Введите валюту'),
  isAvailable: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

const currencyOptions = [
  { value: 'RUB', label: 'RUB — Рубль' },
  { value: 'USD', label: 'USD — Доллар' },
  { value: 'EUR', label: 'EUR — Евро' },
  { value: 'KZT', label: 'KZT — Тенге' },
]

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierProduct | null>(null)

  const { data: supData, isLoading: supLoading } = useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => suppliersApi.getById(id!),
    enabled: !!id,
  })

  const { data: spData, isLoading: spLoading } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: () => suppliersApi.getProducts(id!),
    enabled: !!id,
  })

  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })

  const supplier = supData?.data
  const supplierProducts = spData?.data ?? []
  const allProducts = prodData?.data ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'RUB', isAvailable: true },
  })

  const addMutation = useMutation({
    mutationFn: (d: FormData) => suppliersApi.addProduct(id!, { productId: d.productId, price: d.price, currency: d.currency }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supplier-products', id] }); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ spId, d }: { spId: string; d: FormData }) =>
      suppliersApi.updateProduct(id!, spId, { price: d.price, currency: d.currency, isAvailable: d.isAvailable ?? true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supplier-products', id] }); closeModal() },
  })

  const removeMutation = useMutation({
    mutationFn: (spId: string) => suppliersApi.removeProduct(id!, spId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-products', id] }),
  })

  const openAdd = () => { setEditing(null); reset({ productId: '', price: 0, currency: 'RUB', isAvailable: true }); setModalOpen(true) }
  const openEdit = (sp: SupplierProduct) => {
    setEditing(sp)
    reset({ productId: sp.productId, price: sp.price, currency: sp.currency, isAvailable: sp.isAvailable })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = (d: FormData) => {
    if (editing) updateMutation.mutate({ spId: editing.id, d })
    else addMutation.mutate(d)
  }

  const productOptions = allProducts.map((p) => ({ value: p.id, label: `${p.name} (${p.unit})` }))

  if (supLoading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/suppliers" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{supplier?.name ?? '—'}</h1>
          <p className="text-sm text-gray-500">{supplier?.email} · {supplier?.phone}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-400">Контакт</span><p className="font-medium text-gray-800 mt-0.5">{supplier?.contactPerson}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-medium text-gray-800 mt-0.5">{supplier?.email}</p></div>
        <div><span className="text-gray-400">Телефон</span><p className="font-medium text-gray-800 mt-0.5">{supplier?.phone}</p></div>
        <div><span className="text-gray-400">Статус</span><div className="mt-0.5"><Badge label={supplier?.isActive ? 'Активен' : 'Неактивен'} variant={supplier?.isActive ? 'green' : 'gray'} /></div></div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Прайс-лист ({supplierProducts.length})</h2>
        <Button onClick={openAdd}>+ Добавить товар</Button>
      </div>

      {spLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Товар</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Цена</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Валюта</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Доступен</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {supplierProducts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет товаров в прайс-листе</td></tr>
              )}
              {supplierProducts.map((sp) => {
                const product = allProducts.find((p) => p.id === sp.productId)
                return (
                  <tr key={sp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{product?.name ?? sp.productId}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{sp.price.toLocaleString('ru')}</td>
                    <td className="px-4 py-3 text-gray-500">{sp.currency}</td>
                    <td className="px-4 py-3">
                      <Badge label={sp.isAvailable ? 'Да' : 'Нет'} variant={sp.isAvailable ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(sp)}>Изменить</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={removeMutation.isPending && removeMutation.variables === sp.id}
                          onClick={() => { if (confirm('Удалить?')) removeMutation.mutate(sp.id) }}
                        >
                          Удалить
                        </Button>
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
        open={modalOpen}
        title={editing ? 'Редактировать позицию' : 'Добавить товар'}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button form="sp-form" type="submit" loading={isSubmitting || addMutation.isPending || updateMutation.isPending}>
              {editing ? 'Сохранить' : 'Добавить'}
            </Button>
          </>
        }
      >
        <form id="sp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editing && (
            <Select label="Товар" options={productOptions} placeholder="Выберите товар" error={errors.productId?.message} {...register('productId')} />
          )}
          <Input label="Цена" type="number" step="0.01" placeholder="0.00" error={errors.price?.message} {...register('price')} />
          <Select label="Валюта" options={currencyOptions} error={errors.currency?.message} {...register('currency')} />
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded" {...register('isAvailable')} />
              Доступен
            </label>
          )}
        </form>
      </Modal>
    </div>
  )
}
