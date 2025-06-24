import type { AuthResponse, CreateTodoInput, LoginInput, RegisterInput, Todo, TodoFilter, UpdateTodoInput } from '../types';

const API_URL = 'http://localhost:3000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '서버 오류가 발생했습니다.');
    }

    return response.json();
}

export const authService = {
    async login(input: LoginInput): Promise<AuthResponse> {
        const response = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        localStorage.setItem('token', response.token);
        return response;
    },

    async register(input: RegisterInput): Promise<AuthResponse> {
        const response = await fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        localStorage.setItem('token', response.token);
        return response;
    },

    async logout() {
        localStorage.removeItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    },
};

export const todoService = {
    async getAll(filter?: TodoFilter): Promise<Todo[]> {
        const params = new URLSearchParams();
        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, value.toString());
                }
            });
        }
        return fetchWithAuth(`/todos?${params.toString()}`);
    },

    async create(input: CreateTodoInput): Promise<Todo> {
        return fetchWithAuth('/todos', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    async update(id: string, input: UpdateTodoInput): Promise<Todo> {
        return fetchWithAuth(`/todos/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
        });
    },

    async delete(id: string): Promise<void> {
        return fetchWithAuth(`/todos/${id}`, {
            method: 'DELETE',
        });
    },

    async getCategories(): Promise<string[]> {
        return fetchWithAuth('/todos/categories');
    },
}; 