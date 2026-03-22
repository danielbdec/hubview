# 🚀 HubView — Proposta de Novas Funcionalidades

> Análise completa do codebase atual e roadmap de evolução

---

## 📊 Resumo do Estado Atual

O HubView já é uma plataforma robusta de gestão de projetos com:
- ✅ **Kanban Board** com DnD (`@dnd-kit`)
- ✅ **Multiplayer em Tempo Real** (cursores, presença, board sync via Socket.IO)
- ✅ **Dashboard** com métricas e KPIs
- ✅ **Timeline/Gantt** visual
- ✅ **IA Integrada** (subtarefas via OpenAI/n8n)
- ✅ **Optimistic UI** (zero loadings no Kanban)
- ✅ **Temas Light/Dark** com glassmorphism
- ✅ **Notificações/Atividades** com histórico
- ✅ **Gestão de Usuários** com roles (Admin/Operador/Visualizador)
- ✅ **Perfil** com upload de avatar e crop

---

## 🔥 Funcionalidades Propostas (Prioridade Alta)

### 1. 📊 Dashboard Analítico — Gráficos e Métricas Avançadas

**O que falta:** O dashboard atual mostra apenas contadores estáticos. Não há gráficos de evolução temporal.

**Proposta:**
- **Gráfico de Burndown/Burnup** por projeto (tarefas concluídas vs restantes ao longo do tempo)
- **Gráfico de Velocidade da Equipe** (tasks conclusas por semana)
- **Heatmap de Atividade** (estilo GitHub contributions — dias com mais movimentação)
- **Distribuição de Prioridade** em donut/pizza por projeto

**Stack:** `recharts` ou `chart.js` (leve, compatível com SSR e Tailwind)

**Impacto:** ⭐⭐⭐⭐⭐ — Transforma o dashboard de "vitrine" para centro de decisões

---

### 2. 🔍 Busca Global + Filtros Avançados no Kanban

**O que falta:** Não existe busca alguma. Se o time tem 200+ tasks, encontrar algo é scroll infinito.

**Proposta:**
- **Barra de Busca Global** no Header — busca por título, descrição, tag, e assignee em TODOS os projetos
- **Filtros no Board** — por assignee, prioridade, tag, data de vencimento
- **Filtro de Tarefas Vencidas** — highlight visual de tasks com `endDate < hoje`
- Atalho de teclado `Cmd/Ctrl + K` para busca rápida (Command Palette)

**Impacto:** ⭐⭐⭐⭐⭐ — Essencial para produtividade quando a base de dados cresce

---

### 3. 📱 Responsividade Mobile

**O que falta:** O layout da Sidebar + Board é puramente desktop. Em mobile, o conteúdo fica truncado e a Sidebar não adapta.

**Proposta:**
- **Sidebar como Drawer** (hamburger menu) em telas < 768px
- **Board horizontal swipe** (columns side-scroll nativo)
- **TaskModal** adaptado para fullscreen mobile
- **Bottom Navigation** substituindo sidebar em mobile

**Impacto:** ⭐⭐⭐⭐⭐ — Acessibilidade para quem gerencia de qualquer lugar

---

### 4. ⏰ SLA/Deadline Tracker com Alertas Visuais

**O que falta:** Tasks com `endDate` não mostram se estão atrasadas, próximas do prazo, ou vencidas. É invisível.

**Proposta:**
- **Badge de Status Temporal** no card:
  - 🟢 On Track (>3 dias de margem)
  - 🟡 Warning (≤3 dias)
  - 🔴 Overdue (vencida)
- **Notificação automática** quando uma task se aproxima do deadline (via WebSocket)
- **Indicador na Dashboard** com "Tarefas Vencidas Hoje" como métrica principal
- **Cores de urgência no Timeline** que piscam/brilham para atrasadas

**Impacto:** ⭐⭐⭐⭐ — Accountability direta e gestão visual de prazos

---

### 5. 📎 Anexos / Attachments nas Tasks

**O que falta:** Tarefas são apenas texto. Não é possível anexar documentos, imagens, ou links.

**Proposta:**
- **Upload de Arquivos** (imagens, PDFs, docs) armazenados via n8n → S3 ou armazenamento local
- **Preview de Imagem** inline no card e no modal
- **Links externos** renderizados com preview (OpenGraph)
- Limite de 5MB por arquivo, máximo 5 por task

**Impacto:** ⭐⭐⭐⭐ — Transforma o HubView de "lista de tarefas" para "central de trabalho"

---

## 🟡 Funcionalidades Propostas (Prioridade Média)

### 6. 🔐 Permissões por Projeto (RBAC Granular)

**O que falta:** Roles são globais. Um "Visualizador" não pode ser "Operador" em um projeto específico.

**Proposta:**
- **Membros por Projeto** com roles específicas
- **Visibilidade de Projeto** (público para todos vs privado para membros)
- Apenas membros do projeto veem suas tasks e recebem notificações

---

### 7. 📋 Templates de Projeto / Colunas

**O que falta:** Cada novo projeto começa com colunas default genéricas. Se o time tem um fluxo padrão, precisa recriar toda vez.

**Proposta:**
- **Salvar Projeto como Template** (colunas + estrutura)
- **Templates pré-configurados** (Scrum, Kanban Simples, Marketing Campaign, Bug Tracking)
- Criar novo projeto a partir de template existente

---

### 8. 🏷️ Tags Globais / Banco de Tags

**O que falta:** Tags são criadas ad-hoc por task. Não há consistência, duplicam nomes com cores diferentes.

**Proposta:**
- **Biblioteca de Tags** gerenciada no nível do projeto ou global
- **Autocomplete** ao digitar tag no modal
- **Filtro por Tag** no board e na busca

---

### 9. 💬 Menções @ nos Comentários

**O que falta:** O sistema de comentários (`TaskActivitySidebar`) é texto puro. Não é possível mencionar alguém.

**Proposta:**
- **@mention de usuários** nos comentários
- **Notificação push** (via WebSocket) quando alguém é mencionado
- Destaque visual `@NomeDoUsuário` clicável no histórico

---

### 10. 📤 Exportação de Dados

**O que falta:** Não há forma de exportar dados para relatórios ou backups.

**Proposta:**
- **Exportar Board como CSV/Excel** (tarefas, colunas, status, datas, assignee)
- **Exportar Timeline como PDF/Imagem** (print do Gantt)
- **Relatório de Progresso** automatizado e periódico (via n8n workflow)

---

## 🔵 Funcionalidades Propostas (Nice-to-have / Futuro)

### 11. 🤖 IA Avançada — Resumo Automático + Priorização Inteligente

**Evolução do AI que já existe:**
- **Resumo diário por IA** do que foi feito no dia (feed no dashboard)
- **Sugestão de priorização** baseada em deadlines + dependências
- **Auto-assign** sugerido pela IA baseado no histórico de trabalho

---

### 12. 🔗 Dependências entre Tasks

- Task A **bloqueia** Task B
- Visualização de dependência no Timeline (setas entre barras)
- Alerta quando uma task bloqueadora não está concluída

---

### 13. ⏱️ Time Tracking

- **Cronômetro** por task (start/stop)
- **Registro de horas** com campo manual
- **Relatório de horas** por projeto/usuário/semana

---

### 14. 🔄 Automações (Regras de Board)

- "Quando task mover para coluna X → mudar prioridade para alta"
- "Quando task criada → notificar assignee"
- "Quando deadline atingido → mover para coluna 'Atrasadas'"
- Configurável via UI na settings do projeto (regras simples if/then)

---

### 15. 🌙 Modo "Foco" / Deep Work

- Esconder sidebar, notificações, e presença de outros usuários
- Mostrar apenas o board e as tasks do usuário logado
- Timer Pomodoro integrado

---

## 📐 Matriz de Prioridade vs Esforço

| Funcionalidade | Impacto | Esforço | Prioridade |
|---|---|---|---|
| Dashboard Analítico (gráficos) | ⭐⭐⭐⭐⭐ | Médio | 🔴 Alta |
| Busca Global + Filtros | ⭐⭐⭐⭐⭐ | Médio | 🔴 Alta |
| Responsividade Mobile | ⭐⭐⭐⭐⭐ | Alto | 🔴 Alta |
| SLA/Deadline Tracker | ⭐⭐⭐⭐ | Baixo | 🔴 Alta |
| Anexos nas Tasks | ⭐⭐⭐⭐ | Alto | 🟡 Média |
| RBAC Granular | ⭐⭐⭐ | Alto | 🟡 Média |
| Templates de Projeto | ⭐⭐⭐ | Médio | 🟡 Média |
| Tags Globais | ⭐⭐⭐ | Baixo | 🟡 Média |
| @Menções em Comentários | ⭐⭐⭐ | Médio | 🟡 Média |
| Exportação de Dados | ⭐⭐⭐ | Baixo | 🟡 Média |
| IA Avançada | ⭐⭐⭐⭐ | Alto | 🔵 Futuro |
| Dependências de Tasks | ⭐⭐⭐ | Alto | 🔵 Futuro |
| Time Tracking | ⭐⭐⭐ | Médio | 🔵 Futuro |
| Automações de Board | ⭐⭐⭐⭐ | Alto | 🔵 Futuro |
| Modo Foco | ⭐⭐ | Baixo | 🔵 Futuro |

---

## 🎯 Recomendação de Sequência (Sprint Plan)

### Sprint 1 — "Quick Wins" (1-2 semanas)
1. **SLA/Deadline Tracker** — baixo esforço, alto impacto visual
2. **Tags Globais com Autocomplete** — melhoria incremental
3. **Exportação CSV** — funcionalidade básica de dados

### Sprint 2 — "Core Intelligence" (2-3 semanas)
4. **Busca Global + Command Palette** (`Cmd+K`)
5. **Filtros no Board** (por assignee, prioridade, tag, vencimento)
6. **Dashboard Analítico** com gráficos de burndown e velocidade

### Sprint 3 — "Engagement & Mobile" (2-3 semanas)
7. **@Menções nos Comentários** + notificações
8. **Responsividade Mobile** (sidebar drawer, board swipe, bottom nav)

### Sprint 4 — "Power Features" (3-4 semanas)
9. **Anexos/Attachments** nas tasks
10. **Templates de Projeto**
11. **IA Avançada** — resumo diário e sugestões

---

> **Próximo passo:** Me diga quais funcionalidades te interessam mais e eu começo a implementação com plano detalhado + código completo. 🤖
