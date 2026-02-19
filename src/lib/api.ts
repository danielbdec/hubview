export class ApiError extends Error {
    constructor(public status: number, public message: string, public data?: any) {
        super(message);
        this.name = 'ApiError';
    }
}

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorData;
        try {
            errorData = await response.json();
            errorMessage = errorData.error || errorData.message || response.statusText;
        } catch {
            errorMessage = response.statusText;
        }
        throw new ApiError(response.status, errorMessage, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch {
        // If JSON parse fails but response was OK, return empty object or text
        return {} as T;
    }
}

export const api = {
    get: async <T>(url: string, headers: HeadersInit = {}): Promise<T> => {
        const response = await fetch(url, {
            method: 'GET',
            headers: { ...DEFAULT_HEADERS, ...headers },
        });
        return handleResponse<T>(response);
    },

    post: async <T>(url: string, body: any, headers: HeadersInit = {}): Promise<T> => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { ...DEFAULT_HEADERS, ...headers },
            body: JSON.stringify(body),
        });
        return handleResponse<T>(response);
    },

    put: async <T>(url: string, body: any, headers: HeadersInit = {}): Promise<T> => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { ...DEFAULT_HEADERS, ...headers },
            body: JSON.stringify(body),
        });
        return handleResponse<T>(response);
    },

    delete: async <T>(url: string, body?: any, headers: HeadersInit = {}): Promise<T> => {
        const options: RequestInit = {
            method: 'DELETE',
            headers: { ...DEFAULT_HEADERS, ...headers },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        return handleResponse<T>(response);
    },
};
