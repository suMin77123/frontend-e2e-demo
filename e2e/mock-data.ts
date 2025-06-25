import type { AuthResponse, Todo } from '../src/lib/types';

export const mockAuthResponse: AuthResponse = {
    token: 'mock-token',
    user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
    }
};

export const mockTodos: Todo[] = [
    {
        id: 'todo-1',
        title: '프로젝트 기획하기',
        completed: false,
        category: '업무',
        createdAt: '2024-03-20T09:00:00.000Z',
        userId: 'user-1'
    },
    {
        id: 'todo-2',
        title: '운동하기',
        completed: true,
        category: '개인',
        createdAt: '2024-03-20T10:00:00.000Z',
        userId: 'user-1'
    },
    {
        id: 'todo-3',
        title: '장보기',
        completed: false,
        category: '집안일',
        createdAt: '2024-03-20T12:00:00.000Z',
        userId: 'user-1'
    }
];

export const mockCategories = ['업무', '개인', '집안일', '공부']; 