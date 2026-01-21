import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Order } from "@/types";
import { orderService } from "@/services/orderService";
import { tableService } from "@/services/tableService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Search, 
    Calendar, 
    DollarSign, 
    Clock, 
    CheckCircle,
    Eye,
    ArrowRight
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const { data: orders } = useQuery({
        queryKey: ['orders'],
        queryFn: orderService.getAll
    });

    const { data: tables } = useQuery({
        queryKey: ['tables'],
        queryFn: tableService.getAll
    });

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        
        return orders.filter(order => {
            // Status filter
            if (statusFilter !== 'all' && order.status !== statusFilter) return false;
            
            // Search by order ID or table
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchId = order.id?.toString().includes(query);
                const table = tables?.find(t => t.id === order.tableId);
                const matchTable = table?.name.toLowerCase().includes(query);
                if (!matchId && !matchTable) return false;
            }

            // Date range filter
            if (dateFrom) {
                const orderDate = new Date(order.date);
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0); // Start of day
                if (orderDate < from) return false;
            }

            if (dateTo) {
                const orderDate = new Date(order.date);
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999); // End of day
                if (orderDate > to) return false;
            }
            
            return true;
        });
    }, [orders, statusFilter, searchQuery, dateFrom, dateTo, tables]);

    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Đang xử lý</Badge>;
            case 'completed':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Hoàn thành</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Đã hủy</Badge>;
        }
    };

    const getTableName = (tableId?: number) => {
        if (!tableId) return "Không có bàn";
        const table = tables?.find(t => t.id === tableId);
        return table?.name || `Bàn ${tableId}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stats = useMemo(() => {
        if (!orders) return { total: 0, pending: 0, completed: 0, revenue: 0 };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = orders.filter(o => new Date(o.date) >= today);
        
        return {
            total: todayOrders.length,
            pending: todayOrders.filter(o => o.status === 'pending').length,
            completed: todayOrders.filter(o => o.status === 'completed').length,
            revenue: todayOrders
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + o.total, 0)
        };
    }, [orders]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Đơn hôm nay</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Đang xử lý</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Doanh thu</p>
                                <p className="text-2xl font-bold">{stats.revenue.toLocaleString()}đ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã đơn hoặc tên bàn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-row gap-2 items-center">
                        <Input 
                            type="date" 
                            value={dateFrom} 
                            onChange={(e) => setDateFrom(e.target.value)} 
                            className="flex-1 min-w-[120px] sm:w-[150px]"
                        />
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input 
                            type="date" 
                            value={dateTo} 
                            onChange={(e) => setDateTo(e.target.value)} 
                            className="flex-1 min-w-[120px] sm:w-[150px]"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        {(['all', 'pending', 'completed', 'cancelled'] as const).map(status => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                                className="whitespace-nowrap"
                            >
                                {status === 'all' && 'Tất cả'}
                                {status === 'pending' && 'Đang xử lý'}
                                {status === 'completed' && 'Hoàn thành'}
                                {status === 'cancelled' && 'Đã hủy'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách đơn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[600px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Bàn</TableHead>
                                    <TableHead className="hidden md:table-cell">Thời gian</TableHead>
                                    <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
                                    <TableHead className="text-right">Tổng tiền</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Không có đơn hàng nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{getTableName(order.tableId)}</TableCell>
                                            <TableCell className="hidden md:table-cell">{formatDate(order.date)}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {order.total.toLocaleString()}đ
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Order Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Bàn:</span>
                                <span className="font-medium">{getTableName(selectedOrder.tableId)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Thời gian:</span>
                                <span className="font-medium">{formatDate(selectedOrder.date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Trạng thái:</span>
                                {getStatusBadge(selectedOrder.status)}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Thanh toán:</span>
                                <span className="font-medium">
                                    {selectedOrder.paymentMethod === 'cash' && 'Tiền mặt'}
                                    {selectedOrder.paymentMethod === 'transfer' && 'Chuyển khoản'}
                                    {selectedOrder.paymentMethod === 'qr' && 'QR Code'}
                                    {!selectedOrder.paymentMethod && 'Chưa thanh toán'}
                                </span>
                            </div>
                            
                            <div className="border-t pt-4">
                                <p className="font-semibold mb-2">Sản phẩm:</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="border-t pt-4 flex justify-between items-center">
                                <span className="font-bold text-lg">Tổng cộng:</span>
                                <span className="font-bold text-lg text-primary">
                                    {selectedOrder.total.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
