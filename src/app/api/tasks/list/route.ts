import { forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        return await forwardToN8N('hubview-tasks-list', body, request);
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao listar tarefas' }, { status: 502 });
    }
}
