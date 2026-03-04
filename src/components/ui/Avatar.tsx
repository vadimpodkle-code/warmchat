import { getInitials, getAvatarColor } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  firstName: string
  lastName: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isOnline?: boolean
  userId?: string
}

const sizes = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

const dotSizes = {
  xs: 'w-2 h-2 border',
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
}

export function Avatar({ src, firstName, lastName, size = 'md', isOnline, userId }: AvatarProps) {
  const initials = getInitials(firstName, lastName)
  const bgColor = userId ? getAvatarColor(userId) : '#A0856C'

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white select-none`}
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`
            absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-white
            ${isOnline ? 'bg-[#8BAF7E]' : 'bg-[#C8BDB3]'}
          `}
        />
      )}
    </div>
  )
}
