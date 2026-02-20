import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N_API_URL não configurada' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-notifications-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error(`n8n retornou status: ${response.status}`);
        }

        const data = await response.json();

        // n8n might return the array directly or inside 'body' due to the Set/Code node
        const results = Array.isArray(data) ? data : data.body || [];

        return NextResponse.json({ success: true, notifications: results });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar notificações' },
            { status: 502 }
        );
    }
}
