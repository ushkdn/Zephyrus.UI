import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { suppliersApi } from '../../api/suppliers.api'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import type { Supplier } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  contactPerson: z.string().min(1, 'Введите контактное лицо'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(1, 'Введите телефон'),
  isActive: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export function SuppliersPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole('Admin')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() })
  const suppliers = data?.data ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => suppliersApi.create({ name: d.name, contactPerson: d.contactPerson, email: d.email, phone: d.phone }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: FormData }) =>
      suppliersApi.update(id, { name: d.name, contactPerson: d.contactPerson, email: d.email, phone: d.phone, isActive: d.isActive ?? true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const openCreate = () => { setEditing(null); reset({ name: '', contactPerson: '', email: '', phone: '' }); setModalOpen(true) }
  const openEdit = (s: Supplier) => {
    setEditing(s)
    reset({ name: s.name, contactPerson: s.contactPerson, email: s.email, phone: s.phone, isActive: s.isActive })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const onSubmit = (d: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, d })
    else createMutation.mutate(d)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поставщики</h1>
          <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} записей</p>
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Контакт</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Телефон</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Статус</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">Нет поставщиков</td></tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/suppliers/${s.id}`} className="font-medium text-indigo-600 hover:underline">{s.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.contactPerson}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone}</td>
                  <td className="px-4 py-3">
                    <Badge label={s.isActive ? 'Активен' : 'Неактивен'} variant={s.isActive ? 'green' : 'gray'} />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>Изменить</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deleteMutation.isPending && deleteMutation.variables === s.id}
                          onClick={() => { if (confirm('Удалить поставщика?')) deleteMutation.mutate(s.id) }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Редактировать поставщика' : 'Новый поставщик'}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button form="sup-form" type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        }
      >
        <form id="sup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Название" placeholder="ООО Поставщик" error={errors.name?.message} {...register('name')} />
          <Input label="Контактное лицо" placeholder="Иван Иванов" error={errors.contactPerson?.message} {...register('contactPerson')} />
          <Input label="Email" type="email" placeholder="contact@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Телефон" placeholder="+7 999 000 00 00" error={errors.phone?.message} {...register('phone')} />
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
