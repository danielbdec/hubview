import { validateRequired, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validationError = validateRequired(body, ['taskId']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-tasks-delete', body);
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao excluir tarefa' }, { status: 502 });
    }
}
