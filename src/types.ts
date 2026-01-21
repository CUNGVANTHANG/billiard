export interface Product {
    id?: number;
    name: string;
    barcode: string;
    price: number;
    costPrice: number;
    stock: number;
    category: string;
    image?: string;
}

export interface BilliardTable {
    id?: number;
    name: string;
    status: 'available' | 'occupied';
    currentOrderId?: number;
    pricePerHour?: number;
}

export interface Order {
    id?: number;
    date: Date;
    total: number;
    items: { productId: number; quantity: number; price: number; originalPrice?: number; name: string }[];
    paymentMethod?: 'cash' | 'transfer' | 'qr';
    status: 'pending' | 'completed' | 'cancelled';
    tableId?: number;
    customerId?: number;
    note?: string | string[];
    discount?: number;
    customTableFee?: number;
    customItemsTotal?: number;
    customDuration?: number;
    pricePerHour?: number;
}

export interface Customer {
    id?: number;
    name: string;
    phone: string;
    points: number;
}

export interface User {
    id?: number;
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'staff';
}

export interface Coupon {
    id?: number;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    description?: string;
    isActive: boolean;
}
