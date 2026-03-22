# 🏗️ Hubview Platform Architecture & Developer Guide

Esse documento serve como o **Cérebro e Mapa Central do Hubview**, criado com o propósito expresso de integrar futuros desenvolvedores (humanos) e servir como Prompt Base para sessões com LLMs de Agentes Autônomos (como AntiGravity, Gemini, etc). Todo Agente de IA lendo este repositório **deverá processar e respeitar este documento** antes de propor edições.

---

## 💻 Tech Stack Centralizado
O aplicativo constitui-se como um Workflow Dashboard sofisticado.

* **Front-End & Rotas Base**: `Next.js 14/15` (App Router `src/app/`).
* **Estilização UI & UX**: `TailwindCSS v4` com animações avançadas providas pelo `Framer Motion` e biblioteca gráfica do `Ant Design`. Emprego de interfaces Glassmorphism em Night/Light modes (via `ThemeProvider`).
* **Gerenciamento de Estado**: `Zustand` (`src/store`), totalmente reativo aos hooks nativos e WebSockets.
* **Componentização Física**: Foco na biblioteca externa de Kanban (`@dnd-kit/core` para *Drag-and-Drop* customizado em eixos X (Colunas) e Y (Tarefas)).
* **Autenticação**: Própria baseada em Cookie HttpOnly + `localStorage` (`hubview_user` serializado com ID, Nome e E-mail).
* **Motor do Banco de Dados / Proxies API**: Em grande parte baseados em tráfego roteado pelas rotinas webhooks do backend `n8n` (`n8n.uninova.ai`), ativadas por variáveis seguras em `.env` ou `.env.local`: `N8N_API_URL` e `N8N_API_KEY`.

---

## 🗂️ Estrutura Físico-Lógica

```plaintext
/src
  /app
    /(auth)                  # Layouts invisíveis de redirecionamento UI para logins.
    /(dashboard)             # Rotas filhas logadas (/, /projects, /projects/[projectId], /settings).
    /api                     # Bff (Backend-for-Frontend) de Micro-serviços do Next.
      /auth                  # /login, /logout, /me - Gestão do ciclo de vida e cookies do operador.
      /columns, /tasks       # Serviços de payload e interface com o Database central/N8N.
      /projects, /users      # Entidades globais.
  /components
    /board                   # Código vital do Kanban: KanbandBoard, TaskCard, TaskModal, LiveCursors.
    /layout                  # Navbar, Sidebar e Shell Global.
    /ui                      # Design System nativo contendo Button, Card e o ThemeProvider.
  /store                     # kanbanStore.ts e socketStore.ts - Zustand Memory.
```

---

## 🔌 API Gateway Interno (Next.js Routes)

A camada `src/app/api/...` age como um Bff de roteamento seguro para não expor credenciais (n8n Webhook Keys) e bancos ao browser.
1. `GET /api/projects`: Carrega repositórios macro de quadros, validando com a autenticação local.
2. `GET /api/tasks/[projectId]`: Puxa todas as tarefas aninhadas em hierarquia do projeto.
3. `POST /api/auth/login`: Entrega as credenciais primárias do usuário, gera o token JWT localmente, engaveta o raw data e injeta um Cookie `hubview_user` nativo.

---

## 🎮 Multiplayer Ecosystem (WebSockets Layer)

O projeto usa **Socket.IO** isolado via Micro-serviço e está hospedado remotamente em portas proxy do Windows EC2. Nunca integre WebSockets nativos do Next, sempre aponte o `socketStore.ts` com a ENV `NEXT_PUBLIC_SOCKET_URL` para o host de `ws-server` assíncrono.

### Código Central de Tráfego (`ws-server/index.js`)

#### 1. Roteamento de Presença (Global e Isolada)
Quando um cliente dispara o hook de `useEffect` no Store Zustand dele `connectSocket(projectId, currentUser)`:
* Ele emite `"join-room"`. O EC2 processa o Socket e o injeta em dois locais: `rooms[roomId]` (sala fechada do Kanban atual) e `globalUsers` (sala global).
* **`global-presence`** é emitido via Broadcast Aberto: Povoa em tempo real a lista de usuários ativos visualizada no _Dashboard Raiz_.
* **`presence-update`** é emitido de forma fechada apenas dentro do seu `[roomId]`: Exclui cursores de fora do foco.

#### 2. Colaboração Magnética (Cursor & Board Sync)
* Evento `"cursor-move"` transmite as diretrizes visuais em *Milissegundos* para espelhamento em tela alheia na sala ativa.
* Evento `"board-update"` possui Payload Livre: Funciona acionando qualquer gatilho no Store local dos seus pares, fazendo refetche imediato de cartões em movimento, nomes sendo editados, ou colunas inteiras manipuladas via *Drag-and-Drop*.

**Aviso Anti-Gargalo para Agentes IA:**
Se edições estruturais demandarem um banco de dados temporal de cursores, _recuse_ para não engasgar o PM2. A natureza dessa `ws-server` é estritamente volátil, o Banco deve permanecer isolado nas rotas regulares `http /api`.

---

## 🛠️ Contrato de Mão-de-Obra (Boas Práticas para IAs)

1. Ao criar componentes novos, mantenha o escopo Client Component `('use client')` **apenas nas folhas** (foliage). Prefira Servidor nas interfaces de top-level, embora as Views centrais do Dasboard necessitem do DOM para exibir os gráficos.
2. O Design deverá ser guiado por `tailwindcss v4`. Jamais instancie classes de layout rígidas ou hexadecimais nativos (e.g. `bg-[#222]`), obedeça as variáveis relativas `var(--primary)`, `var(--card)` injetadas no CSS Global para suporte Automático Light/Dark Theme.
3. Não presuma autorização direta ao Banco de Dados (Postgres ou SQL Server) a partir das Apis no arquivo `/app/api/`. Utilize sempre do ecossistema Orquestrado por **n8n.uninova.ai** via requisições formadas por Tokens Bearer padronizados.
