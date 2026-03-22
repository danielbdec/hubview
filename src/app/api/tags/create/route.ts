import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;

export async function POST(request: Request) {
    if (!N8N_BASE) {
        return NextResponse.json({ error: 'N8N API URL não configurada' }, { status: 500 });
    }

    try {
        const payload = await request.json();

        // payload expects: { projectId: "...", name: "...", color: "..." }
        if (!payload.projectId || !payload.name || !payload.color) {
            return NextResponse.json({ error: 'Campos incorretos' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-project-tags-create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('N8n error:', response.statusText);
            return NextResponse.json({ error: 'Falha ao comunicar com n8n' }, { status: 502 });
        }

        const text = await response.text();
        let data = text ? JSON.parse(text) : {};

        // Se o n8n retornar um array, pego o primeiro item porque a criação retorna 1 item
        if (Array.isArray(data) && data.length > 0) {
            data = data[0];
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('N8n fetch error (create tag):', error);
        return NextResponse.json({ error: 'Erro de formatação na resposta do n8n' }, { status: 500 });
    }
}
