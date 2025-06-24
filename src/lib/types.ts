export interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    dueDate?: string;
    category?: string;
    userId: string;
}

export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'userId'>;
export type UpdateTodoInput = Partial<CreateTodoInput>;

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput extends LoginInput {
    name: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export type TodoFilter = {
    completed?: boolean;
    category?: string;
    search?: string;
    sortBy?: 'createdAt' | 'dueDate' | 'title';
    sortOrder?: 'asc' | 'desc';
} 