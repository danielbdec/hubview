
import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST() {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N_API_URL não configurada' }, { status: 500 });
    }

    try {
        // 1. Fetch Projects First
        const projectsResponse = await fetch(`${N8N_BASE}/hubview-projeto-consulta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({}),
        });

        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');

        let projects = await projectsResponse.json();
        // Handle n8n array vs single object
        if (!Array.isArray(projects)) projects = [projects];

        // Filter active only to save calls
        const activeProjects = projects.filter((p: any) => p.status !== 'inactive');

        // 2. Fetch Tasks for each project in parallel
        const tasksPromises = activeProjects.map(async (project: any) => {
            try {
                const res = await fetch(`${N8N_BASE}/hubview-tasks-list`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
                    },
                    body: JSON.stringify({ projectId: project.id }),
                });

                if (!res.ok) return [];
                const tasks = await res.json();
                return Array.isArray(tasks) ? tasks.map((t: any) => ({ ...t, projectId: project.id })) : [];
            } catch (e) {
                console.error(`Error fetching tasks for ${project.id}`, e);
                return [];
            }
        });

        const tasksArrays = await Promise.all(tasksPromises);
        const allTasks = tasksArrays.flat();

        // 3. Aggregate Counts
        const counts: Record<string, { total: number; byColumn: Record<string, number>; byPriority: Record<string, number> }> = {};

        allTasks.forEach((task: any) => {
            const pid = task.projectId;
            if (!pid) return;

            if (!counts[pid]) {
                counts[pid] = { total: 0, byColumn: {}, byPriority: { low: 0, medium: 0, high: 0 } };
            }

            counts[pid].total++;

            const colId = task.columnId || 'unknown';
            counts[pid].byColumn[colId] = (counts[pid].byColumn[colId] || 0) + 1;

            const priority = task.priority || 'medium';
            counts[pid].byPriority[priority] = (counts[pid].byPriority[priority] || 0) + 1;
        });

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Erro ao contar tarefas:', error);
        return NextResponse.json({ error: 'Falha ao contar tarefas' }, { status: 502 });
    }
}
