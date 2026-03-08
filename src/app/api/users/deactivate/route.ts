import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json(
            { error: 'N8N_API_URL não configurada' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        if (!body.userId) {
            return NextResponse.json(
                { error: 'userId é obrigatório' },
                { status: 400 }
            );
        }

        const response = await fetch(`${N8N_BASE}/hubview-user-deactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ userId: body.userId }),
        });

        // Safely parse response — n8n may return empty body
        const text = await response.text();
        let data: any = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                // Non-JSON response from n8n
                if (!response.ok) {
                    throw new Error(`n8n retornou status ${response.status}: ${text.slice(0, 200)}`);
                }
                data = { success: true };
            }
        } else if (!response.ok) {
            throw new Error(`n8n retornou status ${response.status} sem resposta`);
        } else {
            data = { success: true };
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Erro ao desativar usuário:', error);
        return NextResponse.json(
            { error: error.message || 'Falha ao desativar usuário' },
            { status: 502 }
        );
    }
}
