import { writable, get } from 'svelte/store';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from '../types';
import { todoService } from '../services/api';

function createTodoStore() {
    const { subscribe, set, update } = writable<Todo[]>([]);
    const { subscribe: filterSubscribe, set: setFilter } = writable<TodoFilter>({});

    return {
        subscribe,
        filterSubscribe,
        setFilter,
        
        async load(filter?: TodoFilter) {
            try {
                const todos = await todoService.getAll(filter);
                set(todos);
            } catch (error) {
                console.error('할 일 목록을 불러오는데 실패했습니다:', error);
                throw error;
            }
        },

        async add(input: CreateTodoInput) {
            try {
                const newTodo = await todoService.create(input);
                update(todos => [...todos, newTodo]);
                return newTodo;
            } catch (error) {
                console.error('할 일을 추가하는데 실패했습니다:', error);
                throw error;
            }
        },

        async remove(id: string) {
            try {
                await todoService.delete(id);
                update(todos => todos.filter(todo => todo.id !== id));
            } catch (error) {
                console.error('할 일을 삭제하는데 실패했습니다:', error);
                throw error;
            }
        },

        async update(id: string, input: UpdateTodoInput) {
            try {
                const updatedTodo = await todoService.update(id, input);
                update(todos => 
                    todos.map(todo => 
                        todo.id === id ? updatedTodo : todo
                    )
                );
                return updatedTodo;
            } catch (error) {
                console.error('할 일을 수정하는데 실패했습니다:', error);
                throw error;
            }
        },

        async toggleComplete(id: string) {
            const todos = get(this);
            const todo = todos.find((t: Todo) => t.id === id);
            if (todo) {
                await this.update(id, { completed: !todo.completed });
            }
        },

        async getCategories() {
            try {
                return await todoService.getCategories();
            } catch (error) {
                console.error('카테고리 목록을 불러오는데 실패했습니다:', error);
                throw error;
            }
        }
    };
}

export const todos = createTodoStore(); 