import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch('https://n8n.uninova.ai/webhook/hubview-project-tags-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Failed to update tag: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data[0] : data);
    } catch (error) {
        console.error('API /tags/update error:', error);
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
    }
}
