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

## ⚡ Motor de Atualizações Otimistas (Optimistic UI & Storage)

Uma das maiores forças do Hubview é a **ausência de Loadings** interativos e Spinner-blocks na experiência de Kanban. Toda a operação massiva do usuário (Arrastar, Editar, Deletar Cartões/Colunas) que é regida pelo arquivo `src/store/kanbanStore.ts` obedece à engenharia **Optimistic UI Update**:
1. **Mutação Síncrona (Agressiva):** A estrutura local do Zustand (Storage) é alterada instantaneamente antes de haver comunicação de rede. A UI renderiza em 60fps.
2. **Background Sync:** Um gatilho assíncrono (geralmente com `debounce`) aciona silenciosamente as rotas no background repassando as edições estruturais pro servidor `n8n`.
3. **Ghost Loading / Rollback:** Cartões ou quadros utilizam a flag `syncStatus: 'syncing'` se precisarem sinalizar spinners minúsculos localizados no card, e não trancam a interface inteira. Em caso de *HTTP-Fail*, realiza-se um Rollback reescrevendo o Estado antigo da máquina perfeitamente.

> **CRÍTICO PARA AGENTES IA E MANUTENÇÕES**: **Jamais instancie bloqueadores UI (Await Fetch)** aguardando N8N antes de promover a edição visual no DOM do usuário ou altere essa lógica do Store, pois criará engasgos no sistema visual. Primeiro manipule as Collections no Zustand, aponte sucesso, e só depois envie pela Web. O EC2 de Sockets acompanha esse movimento disparando reflexos de Estado para os outros colaboradores da sala de forma paralela ao fluxo de Backend.

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

---

## 🗄️ Estrutura Físico-Lógica do Banco de Dados (MSSQL)

A arquitetura de dados não reside com bibliotecas ORM tradicionais (Prisma/Drizzle) no repositório Front-End, sendo o n8n o *Source of Truth* e a ponte direta para o **Microsoft SQL Server**. Os campos a seguir mapeiam os requisitos estritos (Tabelas/Views) transacionados em JSON pelos Webhooks:

### 📄 Entidade `Projects` (Quadros Kanban)
- `id` (string/UUID): Chave primária.
- `title` (string): Nome da operação ou Hub.
- `description` (string, opcional): Resumo de objetivos.
- `status` (string, opcional): Enumeração para controle ativo/inativo.
- `createdAt` / `updatedAt` (number): Timestamps numéricos de ciclo de vida.

### 🗂️ Entidade `Columns` (Estágios do Pipeline)
- `id` (string/UUID): Chave primária.
- `projectId` (string): Chave Estrangeira (FK).
- `title` (string): Estágio de operação (ex: Backlog, Em Andamento).
- `color` (string, opcional): Hexadecimal semântico de UI.
- `isDone` (boolean, opcional): Flag mandatória para arquivamento e cálculo métrico de Taxa de Conclusão no Dashboard.
- `position` (number): Índice nativo de ordenação horizontal.

### 📝 Entidade `Tasks` (Cartões Operacionais)
- `id` (string/UUID): Chave primária.
- `columnId` (string): Chave Estrangeira (FK).
- `projectId` (string): Chave Estrangeira (FK) redundante para Queries planas no n8n.
- `content` (string): Título resumido.
- `description` (string, opcional): Descritivo profundo da operação.
- `priority` (enum: 'low' | 'medium' | 'high'): Tag de peso operacional.
- `assignee` (string, opcional): Operador responsável atrelado.
- `startDate` / `endDate` (string, opcional): Range de prazos (SLA).
- `position` (number): Índice vertical do Cartão na coluna parent.

### 🏷️ Arrays Complementares (Comum via JSONB no SQLite/MSSQL)
- `Tags`: Associativas `{ id, name, color }` gravadas no Node correspondente da Task.
- `Checklist`: Arrays gravados hierarquicamente na Task contendo sub-etapas `{ id, text, completed }`.

### 👥 Entidade `Users` (Operadores Hubview)
- `id` (string/UUID): Chave de Sessão.
- `name` (string): Utilizado para rendering UI e Avatares Glassmorphism Cursors do Multiplayer.
- `email` (string): Credencial root de Token.
- `role` (string, opcional): Escopo de autoridade no sistema.
- `avatar` (string/URL, opcional): Blob visual.
- `isActive` (boolean): Flag de exclusão lógica.

### 🔔 Telemetria Log: `Activities` & `Notifications`
Mapeamento passivo das alterações do sistema, rastreando quem alterou o que (History), inserção de Comments, e interfaceando relatórios de Sino (Inbox Bell) com a API de `/api/notifications/`.

---

## 🛑 Armadilhas Críticas para Agentes IA (Anti-Hallucination Protocol)

Para garantir que futuras manutenções feitas por Inteligência Artificial (Você) não quebrem o Hubview, obedeça às seguintes restrições absolutas de Sistema:

1. **Next.js API Caching (App Router):** Ao criar novas rotas em `src/app/api/`, lembre-se que o Next.js realiza cache estático agressivo. Como os dados vêm do **N8N** (que muda a toda hora), sempre force a revalidação da rota utilizando `export const dynamic = 'force-dynamic';` no topo dos arquivos da API para evitar Ghosts de UI.
2. **Tailwind V4 vs V3:** O projeto opera com o novíssimo motor **TailwindCSS V4** via `@import "tailwindcss"` em `globals.css`. Não tente injetar plugins complexos ou reescrever completamente o arquivo legado `tailwind.config.ts`, pois as cores bases estão todas mapeadas via Variáveis CSS Nativas no `:root` do `globals.css`.
3. **PM2 Daemon (AWS EC2):** Se pedirem para você reiniciar ou verificar o status do servidor de WebSockets via SSH, o nome absoluto do processo na OS é `hubview-ws-multiplayer`. Não use `node index.js` diretamente se o ambiente for Produção, use `pm2 restart hubview-ws-multiplayer`.
4. **Drag and Drop Engine:** O Kanban do projeto utiliza a biblioteca `@dnd-kit/core` por sua compatibilidade com Strict Mode do React 18+. IAs velhas têm a tendência de sugerir Mutações para `react-beautiful-dnd` — **NÃO REESCREVA** as lógicas de DnD para bibliotecas antigas e obsoletas, atenha-se aos `Sensors` e `SortableContext` do `@dnd-kit` já embutidos.

---

## 🤖 Integrações de Inteligência Artificial e Agentes (AI Features)

O Hubview suporta rotinas delegadas a IAs externas via BFF (rotas `/api/tasks/ai-breakdown`). O fluxo padrão destas features é:

1. **Gatilho (Front-End):** Um botão UI (ex: `TaskModal.tsx`) entra em modo `isGeneratingAi` exibindo _Spinners_.
2. **Proxy BFF (`route.ts`):** O Next atua como ponte segura mascarando as chaves rumo ao `n8n.uninova.ai`.
3. **N8N Workflow:** O orquestrador usa Lógica em Grafos (OpenAI Node) para extração de respostas em JSON estruturado.
4. **Tratamento Resiliente na View:** Como o nó de saída do OpenAI pode variar a topologia de Array Base (ex: devolver uma Raw OpenAI string Wrapper com `{ message: content }` em vez da chave `checklist`), a _View Component_ detém um script de **Fallback Parser** que destrincha a string do array de mensagens caso o nó do N8N tenha falhado em descompactar a API.
5. **Estado Local Pré-Save:** A I.A injeta sub-tarefas **apenas no formData do Modal em tela** (via `setFormData`). Não dispara o banco de dados direto, para que o usuário possa aprovar (ou excluir) antes de apertar "Salvar Alterações".
6. **Notificação de Sistema:** Utiliza-se `message.success` ou `message.warning` nativo do `antd` para prover feedbacks sem quebrar a estética fluida.
