import { supabase } from '@/lib/supabase';
import { User } from '@/types';

// For this migration, we assume a simple 'users' table in public schema 
// distinct from Supabase Auth (GoTrue) to match legacy Dexie structure.
// In a real app, we should migrate to Supabase Auth.
export const authService = {
    async login(username: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            // If error is "Row not found", return null
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as User;
    }
};
