import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(date: string): string {
  const d = new Date(date)
  return format(d, 'HH:mm')
}

export function formatConversationTime(date: string): string {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Вчера'
  return format(d, 'dd.MM.yyyy')
}

export function formatLastSeen(date: string): string {
  const d = new Date(date)
  if (isToday(d)) return `был(а) в ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `был(а) вчера в ${format(d, 'HH:mm')}`
  return `был(а) ${formatDistanceToNow(d, { locale: ru, addSuffix: true })}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export function getAvatarColor(id: string): string {
  const colors = [
    '#C4956A', '#8BAF7E', '#7B9EB0', '#B07B9E',
    '#9EB07B', '#B09E7B', '#7B8EB0', '#B07B7B',
  ]
  const index = id.charCodeAt(0) % colors.length
  return colors[index]
}
