import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productsApi } from '../../api/products.api'
import { categoriesApi } from '../../api/categories.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { Product } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  description: z.string().min(1, 'Введите описание'),
  unit: z.string().min(1, 'Введите единицу'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  isActive: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export function ProductsPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() })
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })

  const products = data?.data ?? []
  const categories = catData?.data ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => productsApi.create({ name: d.name, description: d.description, unit: d.unit, categoryId: d.categoryId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: FormData }) =>
      productsApi.update(id, { name: d.name, description: d.description, unit: d.unit, categoryId: d.categoryId, isActive: d.isActive ?? true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const openCreate = () => { setEditing(null); reset({ name: '', description: '', unit: '', categoryId: '' }); setModalOpen(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    reset({ name: p.name, unit: p.unit, categoryId: p.categoryId, description: '', isActive: p.isActive })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = (d: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, d })
    else createMutation.mutate(d)
  }

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} записей</p>
        </div>
        <Button onClick={openCreate}>+ Добавить</Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Название</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ед. изм.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Категория</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет товаров</td></tr>
              )}
              {products.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={p.isActive ? 'Активен' : 'Неактивен'} variant={p.isActive ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Изменить</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deleteMutation.isPending && deleteMutation.variables === p.id}
                          onClick={() => { if (confirm('Удалить?')) deleteMutation.mutate(p.id) }}
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
        title={editing ? 'Редактировать товар' : 'Новый товар'}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button form="prod-form" type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        }
      >
        <form id="prod-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название" placeholder="Название товара" error={errors.name?.message} {...register('name')} />
          <Input label="Описание" placeholder="Описание" error={errors.description?.message} {...register('description')} />
          <Input label="Единица измерения" placeholder="шт., кг, л…" error={errors.unit?.message} {...register('unit')} />
          <Select label="Категория" options={catOptions} placeholder="Выберите категорию" error={errors.categoryId?.message} {...register('categoryId')} />
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded" {...register('isActive')} />
              Активен
            </label>
          )}
        </form>
      </Modal>
    </div>
  )
}
