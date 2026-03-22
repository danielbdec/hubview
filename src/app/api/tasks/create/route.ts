import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['columnId', 'content']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-tasks-create', sanitized, request);
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao criar tarefa' }, { status: 502 });
    }
}
