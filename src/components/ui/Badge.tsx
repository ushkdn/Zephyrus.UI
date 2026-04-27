import clsx from 'clsx'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'indigo'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantMap: Record<string, BadgeVariant> = {
  Pending: 'yellow',
  Approved: 'green',
  Rejected: 'red',
  Ordered: 'indigo',
  Created: 'blue',
  Confirmed: 'indigo',
  Delivered: 'green',
  Cancelled: 'red',
}

export function Badge({ label, variant }: BadgeProps) {
  const v = variant ?? variantMap[label] ?? 'gray'
  return (
    <span
      className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', {
        'bg-green-100 text-green-800': v === 'green',
        'bg-red-100 text-red-800': v === 'red',
        'bg-yellow-100 text-yellow-800': v === 'yellow',
        'bg-blue-100 text-blue-800': v === 'blue',
        'bg-gray-100 text-gray-700': v === 'gray',
        'bg-indigo-100 text-indigo-800': v === 'indigo',
      })}
    >
      {label}
    </span>
  )
}
