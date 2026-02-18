import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        const response = await fetch(
            `${N8N_BASE}/hubview-user-get?userId=${encodeURIComponent(userId)}`,
            {
                method: 'GET',
                headers: {
                    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
        }

        const data = await response.json();
        const user = Array.isArray(data) ? data[0] : data;

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, name, avatar, birthDate } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        const response = await fetch(`${N8N_BASE}/hubview-user-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ userId, name, avatar: avatar || '', birthDate: birthDate || null }),
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
        }

        const data = await response.json();
        const user = Array.isArray(data) ? data[0] : data;

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
