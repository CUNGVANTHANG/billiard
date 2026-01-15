import { create } from 'zustand';
import type { User } from '@/lib/db';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: (user) => {
        localStorage.setItem('user_session', JSON.stringify(user));
        set({ user, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('user_session');
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        const session = localStorage.getItem('user_session');
        if (session) {
            try {
                const user = JSON.parse(session);
                set({ user, isAuthenticated: true });
            } catch (e) {
                localStorage.removeItem('user_session');
                set({ user: null, isAuthenticated: false });
            }
        }
    }
}));
