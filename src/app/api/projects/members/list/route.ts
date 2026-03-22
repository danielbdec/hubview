import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['projectId']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-project-members-list', sanitized, request);
    } catch (error) {
        console.error('Erro ao listar membros:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao listar membros do projeto' }, { status: 502 });
    }
}
