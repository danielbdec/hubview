import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_API_URL;
const API_KEY = process.env.N8N_API_KEY;

/**
 * Validates that required fields are present in the body.
 * Returns an error response if validation fails, or null if valid.
 */
export function validateRequired(
    body: Record<string, unknown>,
    fields: string[]
): NextResponse | null {
    const missing = fields.filter(f => !body[f] && body[f] !== 0 && body[f] !== false);
    if (missing.length > 0) {
        return NextResponse.json(
            { error: `Campos obrigatórios: ${missing.join(', ')}` },
            { status: 400 }
        );
    }
    return null;
}

/**
 * Sanitizes string fields by trimming whitespace.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(body: T): T {
    const sanitized = { ...body };
    for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
            (sanitized as Record<string, unknown>)[key] = (sanitized[key] as string).trim();
        }
    }
    return sanitized;
}

/**
 * Forwards a request to an n8n webhook.
 */
export async function forwardToN8N(
    endpoint: string,
    body: Record<string, unknown>,
    req?: Request,
    method: 'POST' | 'GET' | 'PUT' | 'PATCH' = 'POST'
): Promise<NextResponse> {
    try {
        const url = `${N8N_BASE}/${endpoint}`;

        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
            },
        };

        if (req) {
            const secureUserId = req.headers.get('x-user-id');
            if (secureUserId) {
                body.userId = isNaN(Number(secureUserId)) ? secureUserId : Number(secureUserId);
            }
        }

        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`N8N webhook ${endpoint} failed:`, errorText);
            return NextResponse.json(
                { error: 'Erro ao processar requisição' },
                { status: response.status }
            );
        }

        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Erro ao chamar webhook ${endpoint}:`, error);
        return NextResponse.json(
            { error: 'Erro de conexão com o serviço' },
            { status: 502 }
        );
    }
}
