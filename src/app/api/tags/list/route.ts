import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;

export async function GET(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N API URL não configurada' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-project-tags-list?projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error('N8n error:', response.statusText);
            return NextResponse.json({ error: 'Falha ao comunicar com n8n' }, { status: 502 });
        }

        const text = await response.text();
        let data = text ? JSON.parse(text) : [];

        // Certifica que é um array, pois n8n pode retornar apenas um objeto se a constraint "lastNode" estava ativada
        if (!Array.isArray(data)) {
            data = data.id ? [data] : [];
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('N8n fetch error (list tags):', error);
        return NextResponse.json({ error: 'Erro de formatação na resposta do n8n' }, { status: 500 });
    }
}
