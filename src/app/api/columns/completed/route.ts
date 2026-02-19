import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(req: Request) {
    if (!N8N_BASE) {
        return NextResponse.json(
            { error: 'N8N_API_URL não configurada' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { id, isDone } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID da coluna é obrigatório' },
                { status: 400 }
            );
        }

        const response = await fetch(`${N8N_BASE}/hubview-columns-completed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ id, isDone }),
        });

        if (!response.ok) {
            throw new Error(`n8n retornou status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao atualizar status de conclusão da coluna:', error);
        return NextResponse.json(
            { error: 'Falha ao atualizar status de conclusão' },
            { status: 502 }
        );
    }
}
