import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../api/notifications.api'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'

export function NotificationsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getByRecipient(user!.id),
    enabled: !!user?.id,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  })

  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead)
    await Promise.all(unread.map((n) => notificationsApi.markAsRead(n.id)))
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            Прочитать все
          </Button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-400 text-sm">Уведомлений нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border px-5 py-4 flex items-start gap-4 transition-colors ${
                n.isRead ? 'border-gray-100' : 'border-indigo-200 bg-indigo-50/30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-indigo-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{n.title}</span>
                  <Badge label={n.type} variant="indigo" />
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.dateCreated).toLocaleString('ru')}</p>
              </div>
              {!n.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={markReadMutation.isPending && markReadMutation.variables === n.id}
                  onClick={() => markReadMutation.mutate(n.id)}
                >
                  Прочитано
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
