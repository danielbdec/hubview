"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format, isPast, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface RawTask {
  id: string;
  content: string;
  description?: string;
  priority: "low" | "medium" | "high";
  tag?: string;
  createdBy: string;
  startDate_planned?: string;
  startDate?: string;
  start_date?: string;
  endDate_planned?: string;
  endDate?: string;
  end_date?: string;
  columnId: string;
  position?: number;
  checklist?: string | { id: string; text: string; completed: boolean }[];
}

interface RawColumn {
  id: string;
  title: string;
  color?: string;
  position?: number;
  completed?: string;
}

interface RawProject {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

interface MyTask {
  id: string;
  content: string;
  description?: string;
  priority: "low" | "medium" | "high";
  tags: Tag[];
  assignee: string;
  startDate?: string;
  endDate?: string;
  columnTitle: string;
  columnColor?: string;
  isDoneColumn: boolean;
  projectId: string;
  projectTitle: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getPriorityConfig = (priority: MyTask["priority"]) => {
  const config = {
    low: { label: "Baixa", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
    medium: { label: "Média", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-400" },
    high: { label: "Alta", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
  };
  return config[priority] || config.low;
};

const getDeadlineStatus = (endDate?: string) => {
  if (!endDate) return null;
  const date = new Date(endDate);
  if (isPast(date) && !isToday(date)) return "overdue";
  if (isToday(date)) return "today";
  if (isPast(addDays(new Date(), -3))) return "soon";
  return "ok";
};

const parseTags = (tag: unknown, taskId: string): Tag[] => {
  if (!tag) return [];
  const raw: any = tag;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "[]" || trimmed === "undefined" || trimmed === "null" || trimmed === '[undefined]' || trimmed === '""') return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((pt: any) => pt && pt.name && pt.name !== "undefined");
        }
        return [];
      } catch {
        return [{ id: "tag-" + taskId, name: trimmed, color: "#3b82f6" }];
      }
    }
    return [{ id: "tag-" + taskId, name: trimmed, color: "#3b82f6" }];
  }
  return Array.isArray(raw) ? (raw as Tag[]) : [raw as Tag];
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTasks, setAllTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  useEffect(() => {
    const fetchMyTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1) Get current user from localStorage (same pattern as kanbanStore.initializeUser)
        let user: User | null = null;
        try {
          const storedUser = localStorage.getItem("hubview_user");
          if (storedUser) {
            user = JSON.parse(storedUser);
          }
        } catch {
          // localStorage parse failed, try API
        }

        // Fallback: try API cookie
        if (!user) {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.authenticated && authData.user) {
              user = authData.user;
            }
          }
        }

        if (!user || !user.name) {
          throw new Error("Usuário não autenticado. Faça login novamente.");
        }
        setCurrentUser(user);

        // 2) Fetch all projects
        const projects = await api.post<RawProject[]>("/api/projects/fetch", {});
        if (!Array.isArray(projects) || projects.length === 0) {
          setAllTasks([]);
          return;
        }

        // 3) Fetch tasks + columns for each project in parallel
        const tasksPerProject = await Promise.all(
          projects.map(async (project) => {
            try {
              const [columns, tasks] = await Promise.all([
                api.post<RawColumn[]>("/api/columns/list", { projectId: project.id }),
                api.post<RawTask[]>("/api/tasks/list", { projectId: project.id }),
              ]);

              if (!Array.isArray(columns) || !Array.isArray(tasks)) return [];

              // Build column lookup
              const columnMap = new Map<string, { title: string; color?: string; isDone: boolean }>();
              columns.forEach((c) => {
                if (c.id && c.title) {
                  columnMap.set(c.id, {
                    title: c.title,
                    color: c.color,
                    isDone: c.completed === "Sim",
                  });
                }
              });

              // Filter tasks assigned to current user
              const myTasks: MyTask[] = tasks
                .filter((t) => t.createdBy === user.name)
                .map((t) => {
                  const col = columnMap.get(t.columnId);
                  return {
                    id: t.id,
                    content: t.content,
                    description: t.description,
                    priority: t.priority,
                    tags: parseTags(t.tag, t.id),
                    assignee: t.createdBy,
                    startDate: t.startDate_planned || t.startDate || t.start_date,
                    endDate: t.endDate_planned || t.endDate || t.end_date,
                    columnTitle: col?.title || "Sem Coluna",
                    columnColor: col?.color,
                    isDoneColumn: col?.isDone || false,
                    projectId: project.id,
                    projectTitle: project.title,
                  };
                });

              return myTasks;
            } catch (err) {
              console.error(`Erro ao buscar tarefas do projeto ${project.title}:`, err);
              return [];
            }
          })
        );

        // 4) Flatten and filter out completed
        const allMyTasks = tasksPerProject.flat().filter((t) => !t.isDoneColumn);

        // 5) Sort by priority (high > medium > low)
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        allMyTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

        setAllTasks(allMyTasks);
      } catch (err: any) {
        console.error("Erro ao carregar My Tasks:", err);
        setError(err.message || "Ocorreu um erro inesperado.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

  // ── Derived State ──────────────────────────────────────────────────────────

  const projectNames = useMemo(() => {
    const names = new Set(allTasks.map((t) => t.projectTitle));
    return Array.from(names).sort();
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterProject !== "all" && t.projectTitle !== filterProject) return false;
      return true;
    });
  }, [allTasks, filterPriority, filterProject]);

  const stats = useMemo(() => {
    const overdue = allTasks.filter((t) => getDeadlineStatus(t.endDate) === "overdue").length;
    const high = allTasks.filter((t) => t.priority === "high").length;
    return { total: allTasks.length, overdue, high };
  }, [allTasks]);

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          <p className="text-sm text-[var(--muted-foreground)] font-medium font-sans tracking-tight">
            Buscando suas tarefas em todos os projetos...
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="rounded-lg bg-red-500/10 p-6 text-center max-w-md border border-red-500/20">
          <h2 className="text-lg font-bold text-red-400 mb-2 font-sans tracking-tight uppercase">Erro ao carregar</h2>
          <p className="text-sm text-red-300/80 mb-4 font-sans">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-bold font-sans tracking-tight uppercase"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--card)] px-6 py-5">
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tighter uppercase font-sans">
            Minhas Tarefas
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 font-sans tracking-tight">
            Olá, {currentUser?.name?.split(" ")[0]}. Você tem{" "}
            <strong className="text-[var(--foreground)]">{stats.total}</strong> tarefa(s) pendente(s)
            {stats.overdue > 0 && (
              <span className="text-red-400 ml-1">
                · {stats.overdue} vencida(s)
              </span>
            )}
            {stats.high > 0 && (
              <span className="text-orange-400 ml-1">
                · {stats.high} alta prioridade
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[var(--sidebar)] border border-[var(--sidebar-border)] text-[var(--foreground)] text-xs font-bold font-sans tracking-tight uppercase rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="all">Prioridade</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[var(--sidebar)] border border-[var(--sidebar-border)] text-[var(--foreground)] text-xs font-bold font-sans tracking-tight uppercase rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] max-w-[200px]"
          >
            <option value="all">Projeto</option>
            {projectNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--sidebar-border)] bg-[var(--card)] p-12 text-center">
              <span className="text-4xl mb-4">🎉</span>
              <h3 className="text-lg font-bold text-[var(--foreground)] font-sans tracking-tight uppercase">
                Tudo limpo por aqui!
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-sm font-sans">
                {allTasks.length > 0
                  ? "Nenhuma tarefa corresponde aos filtros selecionados."
                  : "Você não possui nenhuma tarefa pendente no momento."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--sidebar-border)] bg-[var(--card)]">
              <ul className="divide-y divide-[var(--sidebar-border)]">
                {filteredTasks.map((task) => {
                  const priority = getPriorityConfig(task.priority);
                  const deadlineStatus = getDeadlineStatus(task.endDate);

                  return (
                    <li key={task.id} className="group hover:bg-[var(--card-hover)] transition-colors">
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                          {/* Task Title + Priority */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors font-sans tracking-tight">
                              {task.content}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priority.bg} ${priority.text} ${priority.border}`}
                            >
                              <span className={`block h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                              {priority.label}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] font-sans tracking-tight flex-wrap">
                            {/* Project */}
                            <span className="flex items-center gap-1.5">
                              <span
                                className="block h-2 w-2 rounded-sm"
                                style={{ backgroundColor: task.columnColor || "var(--primary)" }}
                              />
                              {task.projectTitle}
                            </span>

                            {/* Column */}
                            <span className="text-[var(--muted-foreground)]/60">
                              {task.columnTitle}
                            </span>

                            {/* Deadline */}
                            {task.endDate && (
                              <span
                                className={`flex items-center gap-1 ${
                                  deadlineStatus === "overdue"
                                    ? "text-red-400 font-semibold"
                                    : deadlineStatus === "today"
                                    ? "text-yellow-400 font-semibold"
                                    : ""
                                }`}
                              >
                                {deadlineStatus === "overdue" && "⚠️ "}
                                🗓️{" "}
                                {format(new Date(task.endDate), "dd 'de' MMM", {
                                  locale: ptBR,
                                })}
                                {deadlineStatus === "overdue" && " (vencida)"}
                                {deadlineStatus === "today" && " (hoje)"}
                              </span>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                              <span className="flex items-center gap-1">
                                {task.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                    style={{
                                      backgroundColor: tag.color + "20",
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="ml-4 flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
