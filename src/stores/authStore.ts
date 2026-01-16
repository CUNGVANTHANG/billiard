import { create } from 'zustand';
import type { User } from '@/lib/db';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

// Initialize state from local storage to avoid flicker/redirect on refresh
const getInitialState = () => {
    const session = localStorage.getItem('user_session');
    if (session) {
        try {
            return { user: JSON.parse(session), isAuthenticated: true };
        } catch (e) {
            localStorage.removeItem('user_session');
        }
    }
    return { user: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set) => ({
    ...getInitialState(),
    login: (user) => {
        localStorage.setItem('user_session', JSON.stringify(user));
        set({ user, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('user_session');
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        // Fallback or re-verification if needed, but redundant with synchronous init for simple cases
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
