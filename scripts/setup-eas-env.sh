#!/bin/bash

# Script para configurar variáveis de ambiente no EAS Build
# Execute: bash scripts/setup-eas-env.sh

echo "🔐 Configurando variáveis de ambiente no EAS..."

# Carregar variáveis do .env
source .env

# Configurar variáveis (você precisará selecionar "Plain text" quando perguntado)
echo "📝 Adicionando EXPO_PUBLIC_SUPABASE_URL..."
npx eas-cli env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --type string

echo "📝 Adicionando EXPO_PUBLIC_SUPABASE_ANON_KEY..."
npx eas-cli env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --type string

echo "📝 Adicionando EXPO_PUBLIC_SENTRY_DSN..."
npx eas-cli env:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "$EXPO_PUBLIC_SENTRY_DSN" --type string

echo "📝 Adicionando EXPO_PUBLIC_MIXPANEL_TOKEN..."
npx eas-cli env:create --scope project --name EXPO_PUBLIC_MIXPANEL_TOKEN --value "$EXPO_PUBLIC_MIXPANEL_TOKEN" --type string

echo "📝 Adicionando EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB..."
npx eas-cli env:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB --value "$EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB" --type string

if [ ! -z "$EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID" ]; then
  echo "📝 Adicionando EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID..."
  npx eas-cli env:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID --value "$EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID" --type string
fi

if [ ! -z "$EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS" ]; then
  echo "📝 Adicionando EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS..."
  npx eas-cli env:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS --value "$EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS" --type string
fi

echo "✅ Variáveis configuradas! Agora você pode fazer o build novamente."

