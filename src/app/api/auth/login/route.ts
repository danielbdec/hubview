import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        const response = await fetch(`${N8N_BASE}/hubview-auth-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Erro ao conectar com o servidor de autenticação' },
                { status: 500 }
            );
        }

        const data = await response.json();

        // n8n returns array. Check if user was found
        const user = Array.isArray(data) ? data[0] : data;

        if (!user || !user.id) {
            return NextResponse.json(
                { error: 'Email ou senha inválidos' },
                { status: 401 }
            );
        }

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            birthDate: user.birthDate,
        };

        // Create response with HttpOnly cookie
        const res = NextResponse.json({
            success: true,
            user: userData,
        });

        const { signJWT } = await import('@/lib/jwt');
        const token = await signJWT(user.id);

        // Set HttpOnly secure cookie with user session data
        res.cookies.set('hubview_auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // Set a separate non-httpOnly cookie with user data for client-side access
        // (name, avatar, role - non-sensitive data only)
        res.cookies.set('hubview_user', JSON.stringify(userData), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
