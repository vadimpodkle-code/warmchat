-- =============================================
-- WarmChat — SQL схема для Supabase
-- Запусти это в Supabase SQL Editor
-- =============================================

-- 1. Профили пользователей
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$')
);

-- 2. Переписки
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Участники переписок
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 4. Сообщения
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'file')),
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

-- 5. Статусы прочтения
CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- =============================================
-- ИНДЕКСЫ для быстрой работы
-- =============================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- =============================================
-- ROW LEVEL SECURITY (защита данных)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Profiles: все видят профили, каждый редактирует только свой
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Conversations: создатель или участники видят переписки
CREATE POLICY "Members can view their conversations" ON public.conversations
  FOR SELECT USING (
    created_by = auth.uid() OR
    id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Conversation members (creator bypass для избежания circular dependency)
CREATE POLICY "Members can view conversation members" ON public.conversation_members
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE created_by = auth.uid()
    )
    OR
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join conversations" ON public.conversation_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.conversations WHERE id = conversation_id
    ) OR auth.uid() = user_id
  );

-- Messages: только участники переписки
CREATE POLICY "Members can view messages" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
    )
  );

-- Message reads
CREATE POLICY "Members can view read statuses" ON public.message_reads
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can mark messages as read" ON public.message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update read status" ON public.message_reads
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- REALTIME: включаем для таблиц
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;

-- =============================================
-- STORAGE: создаём bucket'ы для файлов
-- (настрой вручную в Supabase Storage или раскомментируй)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies (раскомментируй если нужно)
-- CREATE POLICY "Authenticated users can upload images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Images are publicly accessible" ON storage.objects
--   FOR SELECT USING (bucket_id = 'chat-images');

-- =============================================
-- ТРИГГЕР: автоматическое создание профиля
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $func$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, is_online, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Пользователь'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULL,
    false,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
