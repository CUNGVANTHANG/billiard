import Dexie, { type Table } from 'dexie';

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
    items: { productId: number; quantity: number; price: number, name: string }[];
    paymentMethod?: 'cash' | 'transfer' | 'qr';
    status: 'pending' | 'completed' | 'cancelled';
    tableId?: number;
    customerId?: number;
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
    password: string; // In a real app, hash this!
    fullName: string;
    role: 'admin' | 'staff';
}

export class POSDatabase extends Dexie {
    products!: Table<Product>;
    orders!: Table<Order>;
    customers!: Table<Customer>;
    users!: Table<User>;
    billiardTables!: Table<BilliardTable>;

    constructor() {
        super('POS365Database');
        this.version(1).stores({
            products: '++id, barcode, name, category',
            orders: '++id, date, paymentMethod, status, tableId',
            customers: '++id, phone, name',
            users: '++id, username, role',
            billiardTables: '++id, name, status'
        });
    }
}

export const db = new POSDatabase();
