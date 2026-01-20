import { create } from 'zustand';
import type { Product, Order } from '@/lib/db'; // Use type-only import for Product and Order too if exported as interfaces
import { db } from '@/lib/db';

interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    activeTableId: number | null;
    isTableOccupied: boolean;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
    setActiveTable: (tableId: number | null) => Promise<void>;
    saveCurrentOrder: () => Promise<void>;
    startSession: () => Promise<void>;
    resetTable: () => Promise<void>;
    customerId: number | null;
    notes: string[];
    setCustomer: (customerId: number | null) => void;
    setNotes: (notes: string[]) => void;
    checkout: (amount: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    activeTableId: null,
    isTableOccupied: false,
    customerId: null,
    notes: [],

    setCustomer: (customerId) => {
        set({ customerId });
        get().saveCurrentOrder();
    },

    setNotes: (notes) => {
        set({ notes });
        get().saveCurrentOrder();
    },

    addToCart: (product) => {
        set((state) => {
            const existingItem = state.items.find((item) => item.id === product.id);
            if (existingItem) {
                return {
                    items: state.items.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            return { items: [...state.items, { ...product, quantity: 1 }] };
        });
        // Auto save
        get().saveCurrentOrder();
    },

    removeFromCart: (productId) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
        }));
        get().saveCurrentOrder();
    },

    updateQuantity: (productId, quantity) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            ),
        }));
        get().saveCurrentOrder();
    },

    clearCart: () => {
        set({ items: [], notes: [] });
        get().saveCurrentOrder();
    },

    total: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    setActiveTable: async (tableId) => {
        set({ activeTableId: tableId, notes: [] });

        if (tableId) {
            // 2. Load pending order for this table
            const table = await db.billiardTables.get(tableId);
            if (table && table.currentOrderId) {
                const order = await db.orders.get(table.currentOrderId);
                if (order && order.status === 'pending') {
                    const cartItems: CartItem[] = order.items.map(i => ({
                        id: i.productId,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        barcode: '',
                        costPrice: 0,
                        stock: 0,
                        category: ''
                    }));
                    // Handle legacy string note or new array notes
                    const notes = Array.isArray(order.note) ? order.note : (order.note ? [order.note] : []);
                    set({ items: cartItems, isTableOccupied: true, customerId: order.customerId || null, notes });
                    return;
                }
            }
            // If no pending order or table empty
            set({ items: [], isTableOccupied: table?.status === 'occupied', customerId: null, notes: [] });
        } else {
            set({ items: [], isTableOccupied: false, customerId: null, notes: [] });
        }
    },

    saveCurrentOrder: async () => {
        const { activeTableId, items, total } = get();
        if (!activeTableId) return;

        const table = await db.billiardTables.get(activeTableId);
        if (!table || !table.currentOrderId) return;

        // Update items and total only, preserving date
        await db.orders.update(table.currentOrderId, {
            total: total(),
            items: items.map(i => ({
                productId: i.id!,
                quantity: i.quantity,
                price: i.price,
                name: i.name
            })),
            customerId: get().customerId || undefined,
            note: get().notes
        });
    },

    startSession: async () => {
        const { activeTableId, items, total, notes } = get();
        if (!activeTableId) return;

        const table = await db.billiardTables.get(activeTableId);
        if (!table || table.status === 'occupied') return; // Already occupied

        const orderData: Order = {
            date: new Date(),
            total: total(),
            items: items.map(i => ({
                productId: i.id!,
                quantity: i.quantity,
                price: i.price,
                name: i.name
            })),
            status: 'pending',
            tableId: activeTableId,
            customerId: get().customerId || undefined,
            note: notes
        };

        const orderId = await db.orders.add(orderData);
        await db.billiardTables.update(activeTableId, {
            currentOrderId: orderId as number,
            status: 'occupied'
        });

        set({ isTableOccupied: true });
    },

    resetTable: async () => {
        const { activeTableId } = get();
        if (!activeTableId) return;

        const table = await db.billiardTables.get(activeTableId);
        if (!table) return;

        // Delete the pending order if exists
        if (table.currentOrderId) {
            await db.orders.delete(table.currentOrderId);
        }

        // Reset table to available
        await db.billiardTables.update(activeTableId, {
            status: 'available',
            currentOrderId: undefined
        });

        // Clear local state
        set({ items: [], isTableOccupied: false, activeTableId: null, customerId: null, notes: [] });
    },

    checkout: async (amount: number) => {
        const { activeTableId, items, customerId, notes } = get();
        if (!activeTableId) return;

        const table = await db.billiardTables.get(activeTableId);
        if (!table || !table.currentOrderId) return;

        // Update Order to completed
        await db.orders.update(table.currentOrderId, {
            status: 'completed',
            total: amount,
            items: items.map(i => ({
                productId: i.id!,
                quantity: i.quantity,
                price: i.price,
                name: i.name
            })),
            paymentMethod: 'cash',
            customerId: customerId || undefined,
            note: notes
        });

        // Update Customer Points (1000VND = 1 point, example)
        if (customerId) {
            const pointsEarned = Math.floor(amount / 1000); // Simple logic
            const customer = await db.customers.get(customerId);
            if (customer && customer.id) {
                await db.customers.update(customer.id, {
                    points: (customer.points || 0) + pointsEarned
                });
            }
        }

        // Update Table to available
        await db.billiardTables.update(activeTableId, {
            status: 'available',
            currentOrderId: undefined
        });

        // Clear local cart
        set({ items: [], activeTableId: null, customerId: null, notes: [] });
    }

}));
