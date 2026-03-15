import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['title']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-projeto-inclui', sanitized);
    } catch (error) {
        console.error('Erro ao criar projeto:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao criar projeto' }, { status: 502 });
    }
}
