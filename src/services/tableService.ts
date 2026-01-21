import { supabase } from '@/lib/supabase';
import { BilliardTable } from '@/types';

export const tableService = {
    async getAll() {
        const { data, error } = await supabase
            .from('billiard_tables')
            .select('*')
            .order('id');

        if (error) throw error;
        return data.map(mapResponse);
    },

    async getById(id: number) {
        const { data, error } = await supabase
            .from('billiard_tables')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapResponse(data);
    },

    async update(id: number, table: Partial<BilliardTable>) {
        const dbTable: any = {};
        if (table.name !== undefined) dbTable.name = table.name;
        if (table.status !== undefined) dbTable.status = table.status;
        if (table.pricePerHour !== undefined) dbTable.price_per_hour = table.pricePerHour;

        // Handle currentOrderId mapping
        if (table.currentOrderId !== undefined) {
            // If logic depends on undefined being "null" in DB
            dbTable.current_order_id = table.currentOrderId || null;
        }

        const { data, error } = await supabase
            .from('billiard_tables')
            .update(dbTable)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapResponse(data);
    },

    // For Management
    async create(table: Omit<BilliardTable, 'id'>) {
        const dbTable = {
            name: table.name,
            status: table.status,
            price_per_hour: table.pricePerHour,
            current_order_id: table.currentOrderId || null
        };

        const { data, error } = await supabase
            .from('billiard_tables')
            .insert([dbTable])
            .select()
            .single();

        if (error) throw error;
        return mapResponse(data);
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('billiard_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

function mapResponse(data: any): BilliardTable {
    return {
        id: data.id,
        name: data.name,
        status: data.status,
        currentOrderId: data.current_order_id,
        pricePerHour: data.price_per_hour
    };
}
