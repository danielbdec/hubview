import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['taskId']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-tasks-update', sanitized);
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 502 });
    }
}
