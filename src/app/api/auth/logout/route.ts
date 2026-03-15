import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ success: true });

    // Clear both cookies
    res.cookies.set('hubview_auth', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    res.cookies.set('hubview_user', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return res;
}
