import { db } from './db';

const products = [
    { name: 'Heineken Beer', barcode: '893123456789', price: 20000, costPrice: 15000, stock: 100, category: 'Bia' },
    { name: 'Tiger Original', barcode: '893987654321', price: 18000, costPrice: 14000, stock: 120, category: 'Bia' },
    { name: 'Coca Cola', barcode: '0123456789', price: 10000, costPrice: 8000, stock: 50, category: 'Nước ngọt' },
    { name: 'Snack Oishi', barcode: '9876543210', price: 5000, costPrice: 3000, stock: 200, category: 'Đồ ăn vặt' },
    { name: 'Red Bull', barcode: '1111111111', price: 15000, costPrice: 10000, stock: 80, category: 'Nước ngọt' },
    { name: 'Lavie Water', barcode: '2222222222', price: 5000, costPrice: 3000, stock: 100, category: 'Nước ngọt' },
];

export async function seedDatabase() {
    const count = await db.products.count();
    if (count === 0) {
        await db.products.bulkAdd(products);
        console.log('Database seeded!');
    }

    // Seed Users
    const userCount = await db.users.count();
    if (userCount === 0) {
        await db.users.bulkAdd([
            { username: 'admin', password: '123', fullName: 'Quản trị viên', role: 'admin' },
            { username: 'staff', password: '123', fullName: 'Nhân viên bán hàng', role: 'staff' },
        ]);
        console.log("Users seeded!");
    }

    // Seed Tables
    const tableCount = await db.billiardTables.count();
    if (tableCount === 0) {
        const tables = Array.from({ length: 12 }, (_, i) => ({
            name: `Bàn ${i + 1}`,
            status: 'available' as const,
            pricePerHour: 50000
        }));
        await db.billiardTables.bulkAdd(tables);
        console.log("Tables seeded!");
    }
}
