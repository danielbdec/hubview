# 🖥️ HubView — Project Management Dashboard

Plataforma de gestão de projetos Kanban com colaboração multiplayer em tempo real, dashboard analítico e integração com IA.

---

## ✨ Features

### 📋 Kanban Board
- Drag-and-drop de tarefas e colunas (`@dnd-kit`)
- Optimistic UI — zero loadings, atualizações instantâneas
- Colunas customizáveis com cores e flag `isDone`
- Criação, edição e exclusão de tasks com modal completo

### 🎯 Task Management
- Prioridades (low, medium, high)
- Tags com cores customizadas
- Checklist de subtarefas
- Datas de início/fim (SLA)
- Assignee por tarefa
- Geração de subtarefas por IA (OpenAI via n8n)

### 📊 Dashboard Analítico
- **Distribuição por Projeto** — gráfico de barras empilhadas por coluna/status
- **Prioridades** — gráfico donut mostrando tarefas por nível de prioridade
- **Progresso dos Projetos** — barras horizontais com % de conclusão
- **Taxa de Conclusão** — radial bar com média geral por projeto
- KPIs: projetos ativos, tarefas ativas, alta prioridade, concluídas
- Gráficos interativos com tooltips glassmorphic (`recharts`)

### 🔍 Busca Global (Command Palette)
- **Atalho Universal** — `Cmd/Ctrl + K` (OS-aware) para abrir em qualquer tela
- **Busca Cross-Project** — resultados unificados de Projetos, Tarefas e Páginas do sistema
- **Navegação Inteligente** — navegação full-keyboard (setas, Esc, Enter)
- **Interface Premium** — modal com glassmorphism, blur e highlights de categorização

### 🎮 Multiplayer em Tempo Real
- Cursores ao vivo de outros operadores (`LiveCursors`)
- Indicadores de presença com avatares (`PresenceAvatars`)
- Sincronização de board via WebSocket (Socket.IO)
- Presença global no dashboard + presença isolada por projeto

### 📅 Timeline / Gantt
- Visualização de tarefas em linha do tempo
- Barras de duração com cores por prioridade

### 🔔 Notificações & Atividades
- Histórico de atividades por tarefa (comentários + history)
- Sistema de notificações com inbox (sino)
- Notificações em tempo real via WebSocket

### 👥 Gestão de Usuários
- Roles: Admin, Operador, Visualizador
- CRUD completo de usuários
- Upload de avatar com crop

### ⚙️ Configurações
- Perfil do usuário com edição de nome, email e avatar
- Temas Light/Dark com glassmorphism
- Informações do sistema

---

## 🛠️ Tech Stack

| Categoria | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Estilização** | TailwindCSS v4, Framer Motion, Ant Design |
| **Estado** | Zustand |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Gráficos** | Recharts |
| **Multiplayer** | Socket.IO (ws-server separado) |
| **Backend/DB** | n8n webhooks → MSSQL |
| **Auth** | Cookie HttpOnly + localStorage |

---

## 🚀 Getting Started

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
N8N_API_URL=https://n8n.uninova.ai/webhook/
N8N_API_KEY=seu_token_aqui
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

### 3. Iniciar o servidor de desenvolvimento

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — WebSocket Server
cd ws-server && node index.js
```

### 4. Acessar

Abra [http://localhost:3000](http://localhost:3000) no seu browser.

---

## 📁 Estrutura do Projeto

```
/src
  /app
    /(auth)                  # Login
    /(dashboard)             # Dashboard, Projetos, Settings, Users
    /api                     # BFF (Backend-for-Frontend)
  /components
    /board                   # Kanban: Board, Card, Modal, LiveCursors, Timeline
    /dashboard               # Gráficos analíticos: Recharts components
    /layout                  # Header, Sidebar, NotificationDropdown
    /ui                      # Design System: Button, Card, ThemeProvider
  /store                     # kanbanStore.ts, socketStore.ts (Zustand)
  /hooks                     # useHydrated, useDebounce
  /lib                       # api.ts, constants.ts
/ws-server                   # Socket.IO server (Node.js)
```

---

## 📄 Documentação Adicional

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Guia técnico detalhado para desenvolvedores e agentes IA
- **[FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)** — Roadmap de funcionalidades futuras com priorização
