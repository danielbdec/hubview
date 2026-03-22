import { validateRequired, sanitizeStrings, forwardToN8N } from '@/lib/apiHelper';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sanitized = sanitizeStrings(body);

        const validationError = validateRequired(sanitized, ['projectId', 'userId', 'role']);
        if (validationError) return validationError;

        // Validate role
        const validRoles = ['owner', 'editor', 'viewer'];
        if (!validRoles.includes(sanitized.role as string)) {
            const { NextResponse } = await import('next/server');
            return NextResponse.json(
                { error: 'Role inválido. Use: owner, editor, ou viewer' },
                { status: 400 }
            );
        }

        return await forwardToN8N('hubview-project-members-update-role', sanitized, request);
    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Falha ao atualizar role do membro' }, { status: 502 });
    }
}
