import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react';

export default function DashboardPage() {
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

    const completedOrders = useLiveQuery(
        () => db.orders.where('status').equals('completed').toArray()
    );

    const totalCustomers = useLiveQuery(() => db.customers.count());

    const stats = useMemo(() => {
        if (!completedOrders) return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = completedOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return { totalRevenue, totalOrders, avgOrderValue };
    }, [completedOrders]);

    const chartData = useMemo(() => {
        if (!completedOrders) return [];

        const now = new Date();
        // Initialize default data based on period
        const labels: string[] = [];
        if (period === 'week') {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                labels.push(days[d.getDay()]); // e.g. T2, T3
            }
        } else if (period === 'month') {
             // For simplicity, just last 10 days or key markers if too crowded? 
             // Or actually full month days if screen allows. 
             // Let's allow Recharts to handle axis skipping but provide all days.
             const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
             for (let i = 1; i <= daysInMonth; i++) {
                 labels.push(i.toString());
             }
        } else if (period === 'year') {
            for (let i = 1; i <= 12; i++) {
                labels.push(`T${i}`);
            }
        }

        // Initialize data map with 0
        const data: Record<string, number> = {};
        labels.forEach(l => { data[l] = 0; });

        // Fill real data
        completedOrders.forEach(order => {
            const date = new Date(order.date);
            let key = '';

            if (period === 'week') {
                 const diffTime = Math.abs(now.getTime() - date.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                 if (diffDays <= 7) {
                     const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                     key = days[date.getDay()];
                 }
            } else if (period === 'month') {
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                     key = date.getDate().toString();
                }
            } else if (period === 'year') {
                if (date.getFullYear() === now.getFullYear()) {
                    key = `T${date.getMonth() + 1}`;
                }
            }

            if (key && data[key] !== undefined) {
                data[key] += order.total;
            }
        });

        return labels.map(name => ({ name, value: data[name] || 0 }));
    }, [completedOrders, period]);

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="week">Tuần này</TabsTrigger>
                        <TabsTrigger value="month">Tháng này</TabsTrigger>
                        <TabsTrigger value="year">Năm nay</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}đ</div>
                        <p className="text-xs text-muted-foreground">
                            {completedOrders?.length || 0} đơn hàng đã hoàn thành
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Số đơn hàng</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trung bình đơn</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgOrderValue.toLocaleString()}đ</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng khách hàng</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalCustomers || 0}</div>
                         <p className="text-xs text-muted-foreground">Tổng số khách hàng</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Biểu đồ doanh thu</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#888888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#888888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value / 1000}k`} 
                                    />
                                    <Tooltip 
                                        formatter={(value: any) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Bar dataKey="value" fill="#adfa1d" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                
                 <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                         <div className="text-sm text-muted-foreground">
                            Các đơn hàng vừa thanh toán
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {completedOrders?.slice(-5).reverse().map(order => (
                                <div key={order.id} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Đơn #{order.id}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.date).toLocaleTimeString('vi-VN')} - {order.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">+{order.total.toLocaleString()}đ</div>
                                </div>
                            ))}
                             {(!completedOrders || completedOrders.length === 0) && (
                                 <div className="text-center text-muted-foreground py-4">Chưa có đơn hàng nào</div>
                             )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
