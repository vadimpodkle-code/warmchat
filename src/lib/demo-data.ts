import type { Profile, Conversation, Message } from '@/types'

// Demo mode check
export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'

// --- Mock Users ---
export const demoCurrentUser: Profile = {
  id: 'user-me',
  first_name: 'Вадим',
  last_name: 'Подклетнов',
  avatar_url: null,
  is_online: true,
  last_seen: new Date().toISOString(),
  created_at: '2025-01-15T10:00:00Z',
}

const demoUsers: Profile[] = [
  {
    id: 'user-1',
    first_name: 'Алина',
    last_name: 'Петрова',
    avatar_url: null,
    is_online: true,
    last_seen: new Date().toISOString(),
    created_at: '2025-02-01T08:00:00Z',
  },
  {
    id: 'user-2',
    first_name: 'Максим',
    last_name: 'Козлов',
    avatar_url: null,
    is_online: false,
    last_seen: new Date(Date.now() - 45 * 60000).toISOString(),
    created_at: '2025-01-20T14:00:00Z',
  },
  {
    id: 'user-3',
    first_name: 'Дарья',
    last_name: 'Иванова',
    avatar_url: null,
    is_online: true,
    last_seen: new Date().toISOString(),
    created_at: '2025-03-01T12:00:00Z',
  },
  {
    id: 'user-4',
    first_name: 'Артём',
    last_name: 'Смирнов',
    avatar_url: null,
    is_online: false,
    last_seen: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: '2025-02-15T09:00:00Z',
  },
]

// --- Mock Messages ---
const now = Date.now()
const min = 60000

function msg(id: string, convId: string, senderId: string, content: string, minutesAgo: number, reads: string[] = []): Message {
  return {
    id,
    conversation_id: convId,
    sender_id: senderId,
    content,
    file_url: null,
    file_type: null,
    file_name: null,
    created_at: new Date(now - minutesAgo * min).toISOString(),
    edited_at: null,
    sender: senderId === 'user-me' ? demoCurrentUser : demoUsers.find(u => u.id === senderId),
    reads: reads.map(uid => ({ message_id: id, user_id: uid, read_at: new Date().toISOString() })),
  }
}

// Conversation 1: Direct with Алина
const conv1Messages: Message[] = [
  msg('m1', 'conv-1', 'user-1', 'Привет! Как дела?', 30, ['user-me']),
  msg('m2', 'conv-1', 'user-me', 'Привет! Всё хорошо, спасибо 😊', 28, ['user-1']),
  msg('m3', 'conv-1', 'user-1', 'Ты уже посмотрел новый мессенджер?', 25, ['user-me']),
  msg('m4', 'conv-1', 'user-me', 'Да, выглядит отлично! Очень нравится дизайн', 23, ['user-1']),
  msg('m5', 'conv-1', 'user-1', 'Согласна, тёплые цвета очень приятные', 20, ['user-me']),
  msg('m6', 'conv-1', 'user-me', 'Давай протестируем групповой чат тоже', 15, ['user-1']),
  msg('m7', 'conv-1', 'user-1', 'Давай! Я добавлю ребят', 5, ['user-me']),
]

// Conversation 2: Direct with Максим
const conv2Messages: Message[] = [
  msg('m10', 'conv-2', 'user-me', 'Максим, привет! Скинь пожалуйста файл с проектом', 120, ['user-2']),
  msg('m11', 'conv-2', 'user-2', 'Привет! Сейчас скину', 110, ['user-me']),
  msg('m12', 'conv-2', 'user-2', 'Готово, вот файл', 105, ['user-me']),
  msg('m13', 'conv-2', 'user-me', 'Спасибо, получил!', 100, []),
]

// Conversation 3: Group chat
const conv3Messages: Message[] = [
  msg('m20', 'conv-3', 'user-1', 'Ребята, давайте обсудим встречу', 60, ['user-me', 'user-3', 'user-4']),
  msg('m21', 'conv-3', 'user-3', 'Давайте! Когда удобно?', 55, ['user-me', 'user-1', 'user-4']),
  msg('m22', 'conv-3', 'user-me', 'Мне удобно в пятницу вечером', 50, ['user-1', 'user-3', 'user-4']),
  msg('m23', 'conv-3', 'user-4', 'Пятница — отлично 👍', 45, ['user-me', 'user-1', 'user-3']),
  msg('m24', 'conv-3', 'user-1', 'Тогда в 18:00 в кафе?', 40, ['user-me', 'user-3']),
  msg('m25', 'conv-3', 'user-3', 'Идёт!', 35, ['user-me', 'user-1']),
]

// Conversation 4: Direct with Дарья (unread)
const conv4Messages: Message[] = [
  msg('m30', 'conv-4', 'user-3', 'Привет! Видела твой проект, это что-то невероятное!', 10, []),
  msg('m31', 'conv-4', 'user-3', 'Можешь рассказать подробнее как ты это сделал?', 8, []),
]

// --- Mock Conversations ---
export const demoConversations: Conversation[] = [
  {
    id: 'conv-4',
    type: 'direct',
    name: null,
    avatar_url: null,
    created_by: 'user-3',
    created_at: '2025-03-01T12:00:00Z',
    last_message: conv4Messages[conv4Messages.length - 1],
    unread_count: 2,
    members: [
      { conversation_id: 'conv-4', user_id: 'user-me', is_admin: false, joined_at: '', profile: demoCurrentUser },
      { conversation_id: 'conv-4', user_id: 'user-3', is_admin: false, joined_at: '', profile: demoUsers[2] },
    ],
  },
  {
    id: 'conv-1',
    type: 'direct',
    name: null,
    avatar_url: null,
    created_by: 'user-me',
    created_at: '2025-02-10T10:00:00Z',
    last_message: conv1Messages[conv1Messages.length - 1],
    unread_count: 0,
    members: [
      { conversation_id: 'conv-1', user_id: 'user-me', is_admin: false, joined_at: '', profile: demoCurrentUser },
      { conversation_id: 'conv-1', user_id: 'user-1', is_admin: false, joined_at: '', profile: demoUsers[0] },
    ],
  },
  {
    id: 'conv-3',
    type: 'group',
    name: 'Встреча друзей',
    avatar_url: null,
    created_by: 'user-1',
    created_at: '2025-03-01T08:00:00Z',
    last_message: conv3Messages[conv3Messages.length - 1],
    unread_count: 0,
    members: [
      { conversation_id: 'conv-3', user_id: 'user-me', is_admin: false, joined_at: '', profile: demoCurrentUser },
      { conversation_id: 'conv-3', user_id: 'user-1', is_admin: true, joined_at: '', profile: demoUsers[0] },
      { conversation_id: 'conv-3', user_id: 'user-3', is_admin: false, joined_at: '', profile: demoUsers[2] },
      { conversation_id: 'conv-3', user_id: 'user-4', is_admin: false, joined_at: '', profile: demoUsers[3] },
    ],
  },
  {
    id: 'conv-2',
    type: 'direct',
    name: null,
    avatar_url: null,
    created_by: 'user-me',
    created_at: '2025-02-15T14:00:00Z',
    last_message: conv2Messages[conv2Messages.length - 1],
    unread_count: 0,
    members: [
      { conversation_id: 'conv-2', user_id: 'user-me', is_admin: false, joined_at: '', profile: demoCurrentUser },
      { conversation_id: 'conv-2', user_id: 'user-2', is_admin: false, joined_at: '', profile: demoUsers[1] },
    ],
  },
]

// Messages by conversation
export const demoMessages: Record<string, Message[]> = {
  'conv-1': conv1Messages,
  'conv-2': conv2Messages,
  'conv-3': conv3Messages,
  'conv-4': conv4Messages,
}

export const demoAllUsers = demoUsers
