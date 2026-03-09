export interface Profile {
  id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
  is_online: boolean
  last_seen: string
  created_at: string
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  // joined from query
  last_message?: Message | null
  unread_count?: number
  members?: ConversationMember[]
}

export interface ConversationMember {
  conversation_id: string
  user_id: string
  is_admin: boolean
  joined_at: string
  profile?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_type: 'image' | 'file' | null
  file_name: string | null
  created_at: string
  edited_at: string | null
  sender?: Profile
  reads?: MessageRead[]
}

export interface MessageRead {
  message_id: string
  user_id: string
  read_at: string
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'
