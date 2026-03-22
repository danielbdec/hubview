import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N_API_URL não configurada' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { notificationId } = body;
        
        // Integrar identidade segura validada no middleware
        let userId: any = request.headers.get('x-user-id') || body.userId;
        if (typeof userId === 'string' && !isNaN(Number(userId))) userId = Number(userId);

        if (!notificationId) {
            return NextResponse.json({ error: 'notificationId obrigatório' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-notifications-read-v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ notificationId, userId }),
        });

        if (!response.ok) {
            throw new Error(`n8n retornou status: ${response.status}`);
        }

        const text = await response.text();
        let data = {};
        try { if (text) data = JSON.parse(text); } catch (e) {}
        
        return NextResponse.json({ success: true, ...data });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return NextResponse.json(
            { error: 'Falha ao atulizar notificação' },
            { status: 502 }
        );
    }
}
