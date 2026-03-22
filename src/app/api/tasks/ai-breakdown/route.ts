import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['taskId', 'context']);
        if (validationError) return validationError;

        return await forwardToN8N('hubview-ai-breakdown', sanitized, request);
    } catch (error) {
        console.error('Erro ao processar IA:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao processar requisição de IA' }, { status: 502 });
    }
}
