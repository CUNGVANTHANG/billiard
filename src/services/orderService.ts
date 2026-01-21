import { supabase } from '@/lib/supabase';
import { Order } from '@/types';

export const orderService = {
    async getAll() {
        const { data, error } = await supabase
            .from('orders')
            .select('*, items, customer:customers(name)') // Join customer name if needed
            .order('date', { ascending: false });

        if (error) throw error;
        return data.map(mapResponse);
    },

    async getActiveOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'pending');

        if (error) throw error;
        return data.map(mapResponse);
    },

    async getById(id: number) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        // items is JSONB, automatically parsed by Supabase JS client
        return mapResponse(data);
    },

    async create(order: Omit<Order, 'id'>) {
        // Map camalCase checks if needed. Schema uses snake_case in Supabase usually?
        // Supabase JS client can auto-map if configured, or we map manually.
        // My setup SQL used snake_case for columns like table_id, customer_id.
        // I NEED TO MAP DATA.

        // Let's assume strict mapping for now.
        const dbOrder = {
            date: order.date,
            total: order.total,
            items: order.items, // JSONB
            payment_method: order.paymentMethod,
            status: order.status,
            table_id: order.tableId,
            customer_id: order.customerId,
            discount: order.discount,
            note: Array.isArray(order.note) ? order.note.join('\n') : order.note, // Convert array to string if needed, or store as json? Schema says text.
            // Wait, schema definition: note text.
            // My interface says `note?: string | string[]`.
            // Let's store as string.

            custom_table_fee: order.customTableFee,
            custom_items_total: order.customItemsTotal,
            custom_duration: order.customDuration,
            price_per_hour: order.pricePerHour
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([dbOrder])
            .select()
            .single();

        if (error) throw error;
        return mapResponse(data);
    },

    async update(id: number, order: Partial<Order>) {
        const dbOrder: any = {};
        if (order.total !== undefined) dbOrder.total = order.total;
        if (order.items !== undefined) dbOrder.items = order.items;
        if (order.paymentMethod !== undefined) dbOrder.payment_method = order.paymentMethod;
        if (order.status !== undefined) dbOrder.status = order.status;
        if (order.tableId !== undefined) dbOrder.table_id = order.tableId;
        if (order.customerId !== undefined) dbOrder.customer_id = order.customerId;
        if (order.discount !== undefined) dbOrder.discount = order.discount;
        if (order.note !== undefined) dbOrder.note = Array.isArray(order.note) ? order.note.join('\n') : order.note;
        if (order.customTableFee !== undefined) dbOrder.custom_table_fee = order.customTableFee;
        if (order.customItemsTotal !== undefined) dbOrder.custom_items_total = order.customItemsTotal;
        if (order.customDuration !== undefined) dbOrder.custom_duration = order.customDuration;
        // pricePerHour?? 

        const { data, error } = await supabase
            .from('orders')
            .update(dbOrder)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapResponse(data);
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

function mapResponse(data: any): Order {
    return {
        id: data.id,
        date: new Date(data.date),
        total: data.total,
        items: data.items,
        paymentMethod: data.payment_method,
        status: data.status,
        tableId: data.table_id,
        customerId: data.customer_id,
        discount: data.discount,
        note: data.note,
        customTableFee: data.custom_table_fee,
        customItemsTotal: data.custom_items_total,
        customDuration: data.custom_duration,
        pricePerHour: data.price_per_hour
    };
}
