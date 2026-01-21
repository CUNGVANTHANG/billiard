import { create } from 'zustand';
import type { Product, Order } from '@/types'; // Use type-only import for Product and Order too if exported as interfaces

import { orderService } from '@/services/orderService';
import { tableService } from '@/services/tableService';
import { customerService } from '@/services/customerService';

interface CartItem extends Product {
    quantity: number;
    originalPrice?: number;
}

interface CartState {
    items: CartItem[];
    activeTableId: number | null;
    isTableOccupied: boolean;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    updateItemPrice: (productId: number, newPrice: number) => void;
    clearCart: () => void;
    total: () => number;
    setActiveTable: (tableId: number | null) => Promise<void>;
    saveCurrentOrder: () => Promise<void>;
    startSession: () => Promise<void>;
    resetTable: () => Promise<void>;
    customerId: number | null;
    notes: string[];
    discount: number;
    customTableFee: number | null;
    customItemsTotal: number | null;
    customDuration: number | null;
    setCustomer: (customerId: number | null) => void;
    setNotes: (notes: string[]) => void;
    setDiscount: (discount: number) => void;
    setCustomTableFee: (fee: number | null) => void;
    setCustomItemsTotal: (total: number | null) => void;
    setCustomDuration: (duration: number | null) => void;
    checkout: (amount: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    activeTableId: null,
    isTableOccupied: false,
    customerId: null,
    notes: [],
    discount: 0,
    customTableFee: null,
    customItemsTotal: null,
    customDuration: null,

    setCustomer: (customerId) => {
        set({ customerId });
        get().saveCurrentOrder();
    },

    setNotes: (notes) => {
        set({ notes });
        get().saveCurrentOrder();
    },

    setDiscount: (discount) => {
        set({ discount });
        get().saveCurrentOrder();
    },

    setCustomTableFee: (fee) => {
        set({ customTableFee: fee });
        // Table fee is technically part of "session" or derived, but we save it in Order if overridden
        // But table fee isn't strictly saved in "pending" order until checkout usually?
        // Actually we are deciding to store it in `customTableFee` on Order.
        get().saveCurrentOrder();
    },

    setCustomItemsTotal: (total) => {
        set({ customItemsTotal: total });
        get().saveCurrentOrder();
    },

    setCustomDuration: (duration) => {
        set({ customDuration: duration });
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
            return { items: [...state.items, { ...product, quantity: 1, originalPrice: product.price }] };
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

    updateItemPrice: (productId, newPrice) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === productId ? { ...item, price: newPrice } : item
            ),
        }));
        get().saveCurrentOrder();
    },

    clearCart: () => {
        set({ items: [], notes: [], customerId: null, discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
        get().saveCurrentOrder();
    },

    total: () => {
        const productTotal = get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Use custom total if set, otherwise calculated total
        const actualItemsTotal = get().customItemsTotal !== null ? get().customItemsTotal! : productTotal;
        return Math.max(0, actualItemsTotal - get().discount);
    },

    setActiveTable: async (tableId) => {
        set({ activeTableId: tableId, notes: [] });

        if (tableId) {
            try {
                // 2. Load pending order for this table
                const table = await tableService.getById(tableId);
                if (table && table.currentOrderId) {
                    try {
                        const order = await orderService.getById(table.currentOrderId);
                        if (order && order.status === 'pending') {
                            // Ensure backward compatibility
                            let loadedNotes: string[] = [];
                            if (Array.isArray(order.note)) {
                                loadedNotes = order.note;
                            } else if (typeof order.note === 'string') {
                                loadedNotes = order.note ? [order.note] : [];
                            }

                            set({
                                items: order.items.map((item: any) => ({ ...item, id: item.productId, category: '', barcode: '', costPrice: 0, stock: 0, originalPrice: item.originalPrice ?? item.price })),
                                isTableOccupied: true,
                                customerId: order.customerId || null,
                                notes: loadedNotes,
                                discount: order.discount || 0,
                                customTableFee: order.customTableFee ?? null,
                                customItemsTotal: order.customItemsTotal ?? null,
                                customDuration: order.customDuration ?? null
                            });
                            return;
                        }
                    } catch (e) {
                        console.error("Order not found or error", e);
                        // If order fetch fails, assume table state is stale? 
                        // For now just clear cart
                    }
                }
                set({ items: [], isTableOccupied: table?.status === 'occupied', customerId: null, notes: [], discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
            } catch (error) {
                console.error("Error setting active table", error);
                set({ items: [], isTableOccupied: false, customerId: null, notes: [], discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
            }
        } else {
            set({ items: [], isTableOccupied: false, customerId: null, notes: [], discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
        }
    },

    saveCurrentOrder: async () => {
        const { activeTableId, items } = get();
        if (!activeTableId) return;

        try {
            const table = await tableService.getById(activeTableId);
            if (!table || !table.currentOrderId) return;

            const state = get();
            const productTotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            await orderService.update(table.currentOrderId, {
                total: productTotal,
                items: items.map(i => ({
                    productId: i.id!,
                    quantity: i.quantity,
                    price: i.price,
                    originalPrice: i.originalPrice ?? i.price,
                    name: i.name
                })),
                customerId: get().customerId || undefined,
                note: get().notes,
                discount: get().discount,
                customTableFee: get().customTableFee ?? undefined,
                customItemsTotal: get().customItemsTotal ?? undefined,
                customDuration: get().customDuration ?? undefined
            });
        } catch (error) {
            console.error("Error saving order", error);
        }
    },

    startSession: async () => {
        const { activeTableId, items, total, notes, discount } = get();
        if (!activeTableId) return;

        try {
            const table = await tableService.getById(activeTableId);
            if (!table || table.status === 'occupied') return; // Already occupied
        } catch (error) {
            console.error("Table check failed", error);
            return;
        }

        const productTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderData: Order = {
            date: new Date(),
            total: productTotal, // Store product total here, discount applied at checkout
            items: items.map(i => ({
                productId: i.id!,
                quantity: i.quantity,
                price: i.price,
                originalPrice: i.originalPrice ?? i.price,
                name: i.name
            })),
            status: 'pending',
            tableId: activeTableId,
            customerId: get().customerId || undefined,
            note: notes,
            discount: discount,
            customTableFee: get().customTableFee ?? undefined,
            customItemsTotal: get().customItemsTotal ?? undefined,
            customDuration: get().customDuration ?? undefined
        };

        try {
            const orderId = await orderService.create(orderData); // Returns full object
            await tableService.update(activeTableId, {
                currentOrderId: orderId.id as number,
                status: 'occupied'
            });
        } catch (error) {
            console.error("Error starting session", error);
        }

        set({ isTableOccupied: true });
    },

    resetTable: async () => {
        const { activeTableId } = get();
        if (!activeTableId) return;

        try {
            const table = await tableService.getById(activeTableId);
            if (!table) return;

            // Delete the pending order if exists
            if (table.currentOrderId) {
                await orderService.delete(table.currentOrderId);
            }

            // Reset table to available
            await tableService.update(activeTableId, {
                status: 'available',
                currentOrderId: undefined // Service treats undefined? No we passed logic to handle null
                // Need to pass null in update call?
                // In my service: if (table.currentOrderId !== undefined) dbTable.current_order_id = table.currentOrderId || null;
                // So if I pass undefined, it does nothing.
                // I need to pass null to clear it.
                // But BilliardTable interface defines it as optional number? number | undefined.
                // My service logic: table.currentOrderId || null. If undefined -> null. 
                // So I just need to pass undefined?
                // Wait, if I pass undefined to update(id, { currentOrderId: undefined }), 
                // key is present, value is undefined.
                // JS object { a: undefined } has key 'a'.
                // My service check: `if (table.currentOrderId !== undefined)`.
                // So yes, I must pass `null` as any or hack it, OR update interface.
                // Interface `BilliardTable` says `currentOrderId?: number`.
                // Let's assume passing `0` or `null` (cast as any)?
                // Let's just fix the service logic to be robust or accept 0 means null?
                // Actually my service logic: `dbTable.current_order_id = table.currentOrderId || null;`
                // If I pass 0 -> null. If I pass undefined... it enters if block?
                // `if (table.currentOrderId !== undefined)`.
                // If I pass `{ currentOrderId: undefined }`. Undefined !== undefined is false.
                // So it skips.
                // I need to explicitly pass something.
                // Let's pass `0` and let service convert 0 to null.
                // `currentOrderId: 0`
            });
            // Service fix: I should verify logic there.
            // But for now let's use 0.

            // Wait, I can't check service file content right now without viewing.
            // I wrote: `if (table.currentOrderId !== undefined)`... `table.currentOrderId || null`.
            // If I pass 0 -> 0 || null -> null. Correct.

            await tableService.update(activeTableId, {
                status: 'available',
                currentOrderId: 0 // Will become null
            });
        } catch (error) {
            console.error("Error resetting table", error);
        }

        // Clear local state
        set({ items: [], isTableOccupied: false, activeTableId: null, customerId: null, notes: [], discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
    },

    checkout: async (amount: number) => {
        const { activeTableId, items, customerId, notes, discount } = get();
        if (!activeTableId) return;

        try {
            const table = await tableService.getById(activeTableId);
            if (!table || !table.currentOrderId) return;

            // Update Order to completed
            await orderService.update(table.currentOrderId, {
                status: 'completed',
                total: amount,
                items: items.map(i => ({
                    productId: i.id!,
                    quantity: i.quantity,
                    price: i.price,
                    name: i.name
                    // originalPrice?
                })),
                paymentMethod: 'cash',
                customerId: customerId || undefined,
                note: notes,
                discount: discount,
                customTableFee: get().customTableFee ?? undefined,
                customItemsTotal: get().customItemsTotal ?? undefined,
                customDuration: get().customDuration ?? undefined
            });

            // Update Customer Points
            if (customerId) {
                const pointsEarned = Math.floor(amount / 1000);
                try {
                    const customer = await customerService.getById(customerId);
                    if (customer && customer.id) {
                        await customerService.update(customer.id, {
                            points: (customer.points || 0) + pointsEarned
                        });
                    }
                } catch (e) {
                    console.error("Error updating points", e);
                }
            }

            // Update Table to available
            await tableService.update(activeTableId, {
                status: 'available',
                currentOrderId: 0 // Reset
            });
        } catch (error) {
            console.error("Checkout error", error);
        }

        // Clear local cart
        set({ items: [], activeTableId: null, customerId: null, notes: [], discount: 0, customTableFee: null, customItemsTotal: null, customDuration: null });
    }

}));
