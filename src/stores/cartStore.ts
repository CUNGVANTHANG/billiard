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
    customerId: number | null;
    setCustomer: (customerId: number | null) => void;
    checkout: (amount: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    activeTableId: null,
    isTableOccupied: false,
    customerId: null,

    setCustomer: (customerId) => {
        set({ customerId });
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
        set({ items: [] });
        get().saveCurrentOrder();
    },

    total: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    setActiveTable: async (tableId) => {
        // 1. Save current table's order if exists (handled by auto-save actions mostly, but ensure we don't lose anything before switching? Auto-save covers it)

        set({ activeTableId: tableId });

        if (tableId) {
            // 2. Load pending order for this table
            const table = await db.billiardTables.get(tableId);
            if (table && table.currentOrderId) {
                const order = await db.orders.get(table.currentOrderId);
                if (order && order.status === 'pending') {
                    // Map db items back to cart items (assuming minimal data needed)
                    const cartItems: CartItem[] = order.items.map(i => ({
                        id: i.productId,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        barcode: '', // These fields might be missing in simplified order items, need care. 
                        costPrice: 0,
                        stock: 0,
                        category: ''
                    }));
                    // Ideally we fetch full product details to replenish stock info etc, but for now simple:
                    set({ items: cartItems, isTableOccupied: true, customerId: order.customerId || null });
                    return;
                }
            }
            // If no pending order or table empty
            set({ items: [], isTableOccupied: table?.status === 'occupied', customerId: null });
        } else {
            set({ items: [], isTableOccupied: false, customerId: null });
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
            customerId: get().customerId || undefined
        });
    },

    startSession: async () => {
        const { activeTableId, items, total } = get();
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
            customerId: get().customerId || undefined
        };

        const orderId = await db.orders.add(orderData);
        await db.billiardTables.update(activeTableId, {
            currentOrderId: orderId as number,
            status: 'occupied'
        });

        set({ isTableOccupied: true });
    },

    checkout: async (amount: number) => {
        const { activeTableId, items, customerId } = get();
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
            customerId: customerId || undefined
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
        set({ items: [], activeTableId: null, customerId: null });
    }

}));
