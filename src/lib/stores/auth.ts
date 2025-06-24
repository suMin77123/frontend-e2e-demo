import { writable } from 'svelte/store';
import type { AuthResponse, LoginInput, RegisterInput, User } from '../types';
import { authService } from '../services/api';

function createAuthStore() {
    const { subscribe, set } = writable<User | null>(null);

    return {
        subscribe,
        
        async initialize() {
            const token = authService.getToken();
            if (token) {
                try {
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const user = await response.json();
                        set(user);
                    } else {
                        await this.logout();
                    }
                } catch (error) {
                    console.error('사용자 정보를 불러오는데 실패했습니다:', error);
                    await this.logout();
                }
            }
        },

        async login(input: LoginInput) {
            try {
                const response = await authService.login(input);
                set(response.user);
                return response;
            } catch (error) {
                console.error('로그인에 실패했습니다:', error);
                throw error;
            }
        },

        async register(input: RegisterInput) {
            try {
                const response = await authService.register(input);
                set(response.user);
                return response;
            } catch (error) {
                console.error('회원가입에 실패했습니다:', error);
                throw error;
            }
        },

        async logout() {
            await authService.logout();
            set(null);
        }
    };
}

export const auth = createAuthStore(); 