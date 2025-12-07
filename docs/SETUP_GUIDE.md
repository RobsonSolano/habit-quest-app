# 📱 HabitQuest - Guia Completo de Configuração

Este guia vai te ajudar a configurar o projeto do zero até ter o app funcionando.

---

## 📋 Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** ou **yarn**
- **Expo CLI** (será instalado via npx)
- **Conta no Supabase** (gratuita)
- **Expo Go** no celular (para testar) ou emulador Android/iOS

---

## 🚀 Passo 1: Clonar e Instalar Dependências

```bash
# Entrar na pasta do projeto
cd habit-quest-rn

# Instalar dependências
npm install
```

---

## 🗄️ Passo 2: Configurar o Supabase

### 2.1 Criar Conta e Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `habitquest` (ou outro nome)
   - **Database Password**: Crie uma senha forte (guarde!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

### 2.2 Executar o Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `supabase-schema.sql` do projeto
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Deve aparecer "Success. No rows returned" - isso é normal!

### 2.3 Obter as Chaves de API

1. Vá em **Settings** > **API** (menu lateral)
2. Copie os valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🔑 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env

Na raiz do projeto, crie um arquivo chamado `.env`:

```bash
# No terminal
touch .env
```

### 3.2 Adicionar as chaves

Abra o `.env` e adicione:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**⚠️ IMPORTANTE**: Substitua pelos valores reais que você copiou no passo 2.3

---

## ▶️ Passo 4: Rodar o Projeto

### Opção A: Expo Go (Recomendado para testes)

```bash
npm start
```

1. Escaneie o QR code com o app Expo Go (Android) ou câmera (iOS)
2. O app vai abrir no seu celular!

### Opção B: Emulador Android

```bash
npm run android
```

### Opção C: Simulador iOS (apenas Mac)

```bash
npm run ios
```

---

## ✅ Passo 5: Testar o App

1. **Criar conta**: Na tela de login, vá em "Cadastrar"
2. **Preencher dados**: Nome, email e senha
3. **Verificar**: Você deve ver a tela principal com 3 hábitos padrão
4. **Testar ofensiva**: Complete todos os hábitos para ver a ofensiva aumentar
5. **Testar amigos**: Vá em Amigos > Buscar e procure por username

---

## 🐛 Troubleshooting

### Erro: "Network request failed"
- Verifique se o `.env` está correto
- Verifique se as chaves do Supabase estão certas
- Reinicie o servidor: `npm start --clear`

### Erro: "relation 'profiles' does not exist"
- Execute o schema SQL novamente no Supabase
- Verifique se executou TODO o arquivo SQL

### Erro: "Invalid API key"
- Copie a chave `anon public` novamente do Supabase
- Verifique se não há espaços extras no `.env`

### Tela branca ou travando
- Limpe o cache: `npx expo start --clear`
- Delete `node_modules` e rode `npm install` novamente

---

## 📱 Passo 6: Build para Produção (Play Store)

### 6.1 Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 6.2 Login no Expo

```bash
eas login
```

### 6.3 Configurar EAS

```bash
eas build:configure
```

### 6.4 Configurar Variáveis de Ambiente no EAS

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

### 6.5 Build Android (AAB para Play Store)

```bash
eas build --platform android --profile production
```

### 6.6 Submeter para Play Store

```bash
eas submit --platform android
```

---

## 🔐 Configurar Autenticação Social (Opcional)

### Google Sign-In

1. No Supabase, vá em **Authentication** > **Providers**
2. Habilite **Google**
3. Crie credenciais no [Google Cloud Console](https://console.cloud.google.com)
4. Adicione o Client ID e Secret no Supabase
5. Instale: `npx expo install expo-auth-session expo-crypto`

### Apple Sign-In

1. No Supabase, habilite **Apple** em Providers
2. Configure no Apple Developer Portal
3. Instale: `npx expo install expo-apple-authentication`

---

## 📊 Verificar Dados no Supabase

Você pode ver os dados do app direto no Supabase:

1. **Table Editor** > **profiles**: Usuários cadastrados
2. **Table Editor** > **habits**: Hábitos de cada usuário
3. **Table Editor** > **habit_completions**: Histórico de completados
4. **Table Editor** > **user_stats**: Níveis e XP
5. **Table Editor** > **achievements**: Conquistas
6. **Table Editor** > **friendships**: Amizades

---

## 🏗️ Estrutura do Projeto

```
habit-quest-rn/
├── App.tsx                    # Entry point
├── .env                       # Variáveis de ambiente (criar)
├── supabase-schema.sql        # SQL do banco de dados
├── src/
│   ├── components/
│   │   ├── habits/           # HabitCard, AddHabitModal, UserProfile
│   │   └── ui/               # Button, Card, Input, Modal, Progress
│   ├── contexts/
│   │   └── AuthContext.tsx   # Autenticação Supabase
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── storage.ts       # Serviços (habits, stats, friends, etc)
│   ├── navigation/          # React Navigation
│   ├── screens/
│   │   ├── AuthScreen.tsx   # Login/Cadastro
│   │   ├── IndexScreen.tsx  # Tela principal
│   │   ├── StatsScreen.tsx  # Estatísticas
│   │   ├── ProfileScreen.tsx # Perfil
│   │   └── FriendsScreen.tsx # Amigos
│   └── types/
│       ├── database.ts      # Tipos do Supabase
│       └── habit.ts         # Tipos da UI
└── docs/
    └── SETUP_GUIDE.md       # Este guia
```

---

## 🎮 Funcionalidades Implementadas

- ✅ Autenticação (email/senha)
- ✅ CRUD de hábitos
- ✅ Sistema de XP e níveis
- ✅ Sistema de ofensiva (streak)
  - Zera se falhar 1 dia
  - Aumenta ao completar todos os hábitos do dia
- ✅ Sistema de amigos
  - Buscar por username
  - Enviar/aceitar/rejeitar solicitações
  - Ver perfil de amigos
- ✅ Perfil público
  - Nome, username único, bio
  - Editar perfil próprio
- ✅ Conquistas desbloqueáveis
  - Por streak, nível, hábitos completados, amigos
- ✅ Estatísticas semanais
- ✅ Haptic feedback
- ✅ Pull to refresh
- ✅ Tema escuro

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o Troubleshooting acima
2. Olhe os logs no terminal
3. Verifique o Supabase Dashboard > Logs

---

**Bom desenvolvimento! 🚀**

