import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch('https://n8n.uninova.ai/webhook/hubview-project-tags-delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete tag: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API /tags/delete error:', error);
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
    }
}
