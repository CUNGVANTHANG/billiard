import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Customer[];
    },

    async getById(id: number) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Customer;
    },

    async create(customer: Omit<Customer, 'id'>) {
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single();

        if (error) throw error;
        return data as Customer;
    },

    async update(id: number, customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Customer;
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
