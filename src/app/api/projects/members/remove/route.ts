import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['projectId', 'userId']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-project-members-remove', sanitized, request);
    } catch (error) {
        console.error('Erro ao remover membro:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao remover membro do projeto' }, { status: 502 });
    }
}
