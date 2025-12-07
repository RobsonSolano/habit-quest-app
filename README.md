# 🎯 HabitQuest - React Native

App de rastreamento de hábitos com gamificação completa.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-54-000020)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## ✨ Funcionalidades

### 🎮 Gamificação
- **Sistema de XP e Níveis** - Ganhe pontos ao completar hábitos
- **Ofensiva (Streak)** - Mantenha dias consecutivos de conclusão
  - ⚠️ Zera se você falhar 1 dia!
- **Conquistas** - Desbloqueie medalhas por metas alcançadas

### 👥 Social
- **Sistema de Amigos** - Adicione amigos por username
- **Perfil Público** - Veja ofensiva, nível e pontos de outros
- **Busca de Usuários** - Encontre amigos facilmente

### 📊 Tracking
- **Hábitos Diários/Semanais** - Configure frequência
- **Estatísticas** - Acompanhe progresso semanal
- **Histórico** - Veja completados por dia

## 🛠️ Stack

- **Framework**: Expo + React Native
- **Backend**: Supabase (PostgreSQL + Auth)
- **Estilização**: NativeWind (Tailwind CSS)
- **Navegação**: React Navigation
- **Estado**: React Context + React Query

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Supabase (ver docs/SETUP_GUIDE.md)
# 3. Criar .env com as chaves

# 4. Rodar
npm start
```

## 📚 Documentação

| Doc | Descrição |
|-----|-----------|
| [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | **Guia rápido** - Configurar e rodar o app |
| [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | **Supabase detalhado** - Criar projeto, schema, RLS, troubleshooting |
| [GOOGLE_SIGNIN.md](docs/GOOGLE_SIGNIN.md) | Login com Google |
| [APPLE_SIGNIN.md](docs/APPLE_SIGNIN.md) | Login com Apple (obrigatório para App Store) |
| [PUSH_NOTIFICATIONS.md](docs/PUSH_NOTIFICATIONS.md) | Notificações push - lembretes de hábitos |
| [APP_ICON_SPLASH.md](docs/APP_ICON_SPLASH.md) | Ícone do app e splash screen |
| [ANALYTICS_SENTRY.md](docs/ANALYTICS_SENTRY.md) | Mixpanel (analytics) + Sentry (error tracking) |

## 📱 Screenshots

| Home | Perfil | Amigos |
|------|--------|--------|
| Lista de hábitos, ofensiva, XP | Editar nome, username, bio | Buscar e adicionar amigos |

## 🗃️ Schema do Banco

- `profiles` - Usuários (nome, username, streak)
- `habits` - Hábitos customizados
- `habit_completions` - Histórico diário
- `user_stats` - XP, nível, pontos
- `achievements` - Conquistas
- `friendships` - Relações de amizade

## 📁 Estrutura

```
src/
├── components/       # UI components
├── contexts/        # Auth context
├── lib/            # Supabase + services
├── navigation/     # React Navigation
├── screens/        # Telas do app
└── types/          # TypeScript types
```

## 🔐 Segurança

- Row Level Security (RLS) em todas as tabelas
- Cada usuário só acessa seus próprios dados
- Autenticação via Supabase Auth

## 📦 Build para Play Store

```bash
# Instalar EAS
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile production

# Submit
eas submit --platform android
```

## 📝 Checklist para Produção

- [ ] [Google Sign-In](docs/GOOGLE_SIGNIN.md)
- [ ] [Apple Sign-In](docs/APPLE_SIGNIN.md) ⚠️ Obrigatório para App Store
- [ ] [Push Notifications](docs/PUSH_NOTIFICATIONS.md)
- [ ] [App Icon + Splash](docs/APP_ICON_SPLASH.md)
- [ ] [Analytics + Error Tracking](docs/ANALYTICS_SENTRY.md)
- [ ] Testes em dispositivos reais
- [ ] Build de produção com EAS

## 📄 Licença

MIT

---

**Transforme sua vida, um hábito por vez! 🔥**
