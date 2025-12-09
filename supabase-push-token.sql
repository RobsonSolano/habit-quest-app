-- =============================================
-- ADICIONAR PUSH TOKEN AO PROFILES
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- Adicionar coluna para push token
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Índice para busca (útil se for enviar notificações em massa)
CREATE INDEX IF NOT EXISTS profiles_push_token_idx 
ON public.profiles(push_token) 
WHERE push_token IS NOT NULL;

-- Verificar se foi criado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'push_token';

