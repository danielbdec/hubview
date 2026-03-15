import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const authCookie = request.cookies.get('hubview_auth');
    const userCookie = request.cookies.get('hubview_user');

    if (!authCookie?.value) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let user = null;
    if (userCookie?.value) {
        try {
            user = JSON.parse(userCookie.value);
        } catch {
            // Cookie corrupted
        }
    }

    return NextResponse.json({
        authenticated: true,
        userId: authCookie.value,
        user,
    });
}
