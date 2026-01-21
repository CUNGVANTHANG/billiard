import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const productService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Product[];
    },

    async getById(id: number) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Product;
    },

    async create(product: Omit<Product, 'id'>) {
        // Exclude id from insert if it's undefined
        const { id, ...insertData } = product as any;

        const { data, error } = await supabase
            .from('products')
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    },

    async update(id: number, product: Partial<Product>) {
        // Exclude id from update
        const { id: _, ...updateData } = product;

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
