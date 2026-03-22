import { jwtVerify, SignJWT } from 'jose';

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
    return new TextEncoder().encode(secret);
};

export async function signJWT(userId: string): Promise<string> {
    const token = await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecretKey());
    
    return token;
}

export async function verifyJWT(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return payload.sub as string;
    } catch (error) {
        console.error('Falha ao verificar JWT:', error);
        return null;
    }
}
