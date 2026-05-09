import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { categoriesApi } from '../../api/categories.api'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageLoader } from '../../components/ui/Spinner'
import type { Category } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  parentId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function CategoriesPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole('Admin')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })
  const categories = data?.data ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => categoriesApi.create({ name: d.name, parentId: d.parentId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: FormData }) =>
      categoriesApi.update(id, { name: d.name, parentId: d.parentId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const openCreate = () => { setEditing(null); reset({ name: '', parentId: '' }); setModalOpen(true) }
  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({ name: cat.name, parentId: cat.parentId ?? '' })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = (d: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, d })
    else createMutation.mutate(d)
  }

  const parentOptions = categories
    .filter((c) => !editing || c.id !== editing.id)
    .map((c) => ({ value: c.id, label: c.name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} записей</p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ Добавить</Button>}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Название</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Родитель</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Создана</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length === 0 && (
                <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-gray-400">Нет категорий</td></tr>
              )}
              {categories.map((cat) => {
                const parent = categories.find((c) => c.id === cat.parentId)
                return (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500">{parent?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(cat.dateCreated).toLocaleDateString('ru')}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(cat)}>Изменить</Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={deleteMutation.isPending && deleteMutation.variables === cat.id}
                            onClick={() => { if (confirm('Удалить?')) deleteMutation.mutate(cat.id) }}
                          >
                            Удалить
                          </Button>
                        </div>
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
        open={modalOpen}
        title={editing ? 'Редактировать категорию' : 'Новая категория'}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button form="cat-form" type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название" placeholder="Название категории" error={errors.name?.message} {...register('name')} />
          <Select
            label="Родительская категория"
            options={parentOptions}
            placeholder="Без родителя"
            {...register('parentId')}
          />
        </form>
      </Modal>
    </div>
  )
}
