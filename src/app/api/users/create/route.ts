import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N_API_URL não configurada' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-user-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify(body),
        });

        // Some webhooks might not return JSON if they fail, so we text-parse first
        const rawText = await response.text();
        let data;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (e) {
            console.error('Failed to parse n8n response as JSON:', rawText);
            data = { error: 'Resposta inválida do servidor de integração.' };
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.message || 'Falha ao registrar usuário' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro no cadastro:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 502 });
    }
}
