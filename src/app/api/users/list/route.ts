import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function GET() {
    if (!N8N_BASE) {
        return NextResponse.json(
            { error: 'N8N_API_URL não configurada' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(`${N8N_BASE}/hubview-users-list`, {
            method: 'GET',
            headers: {
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`n8n retornou status: ${response.status}`);
        }

        const data = await response.json();
        const users = Array.isArray(data) ? data : [data];

        // Return only id and name for the selector
        const mapped = users.map((u: any) => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar || '',
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar usuários' },
            { status: 502 }
        );
    }
}
