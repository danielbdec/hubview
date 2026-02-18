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

        // Webhook: hubview-columns-update
        const response = await fetch(`${N8N_BASE}/hubview-columns-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`n8n retornou status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao atualizar coluna:', error);
        return NextResponse.json(
            { error: 'Falha ao atualizar coluna' },
            { status: 502 }
        );
    }
}
