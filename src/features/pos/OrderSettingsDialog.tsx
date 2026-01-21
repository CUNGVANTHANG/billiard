import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

interface CartItem {
    name: string;
    price: number;
    quantity: number;
}

interface OrderSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentOrder: Order;
    tableName: string;
    items: CartItem[];
    tableFee: number;
    defaultPricePerHour: number;
    defaultDurationMinutes: number;
    onSave: (data: { 
        date: Date; 
        pricePerHour: number; 
        discount: number; 
        customDuration: number | null; 
        customTableFee: number | null;
        customItemsTotal: number | null;
    }) => Promise<void>;
}

export function OrderSettingsDialog({ open, onOpenChange, currentOrder, tableName, items, tableFee, defaultPricePerHour, defaultDurationMinutes, onSave }: OrderSettingsProps) {
    const { register, handleSubmit, setValue, watch } = useForm<{ 
        startTime: string; 
        pricePerHour: number;
        discount: number;
        couponCode: string;
        customDurationHours: number;
        customDurationMinutes: number;
        customTableFee: number;
    }>();
    const [isLoading, setIsLoading] = useState(false);

    const watchDiscount = watch("discount", 0);
    const watchTableFee = watch("customTableFee", 0);
    const watchHours = watch("customDurationHours", 0);
    const watchMinutes = watch("customDurationMinutes", 0);
    const watchStartTime = watch("startTime");

    useEffect(() => {
        if (open && currentOrder) {
            // Format Date
            const date = new Date(currentOrder.date);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
            
            setValue('startTime', localISOTime);
            setValue('pricePerHour', currentOrder.pricePerHour || defaultPricePerHour || 0); 
            setValue('discount', currentOrder.discount || 0);
            
            // Handle Custom Duration Split
            // Default to current duration (elapsed or set) so inputs are populated
            const totalMins = currentOrder.customDuration ?? defaultDurationMinutes ?? 0;
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            setValue('customDurationHours', h);
            setValue('customDurationMinutes', m);

            setValue('customTableFee', currentOrder.customTableFee ?? tableFee);
        }
    }, [open, currentOrder, tableFee, defaultPricePerHour, defaultDurationMinutes, setValue]);

    const handleCouponEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = e.currentTarget.value.toUpperCase();
            try {
                const { data: coupon, error } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('code', code)
                    .single();

                if (coupon && coupon.is_active) {
                    let val = 0;
                    if (coupon.type === 'percent') {
                        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
                        val = (subtotal * coupon.value) / 100;
                    } else {
                        val = coupon.value;
                    }
                    setValue('discount', val);
                    toast.success(`Đã áp dụng mã ${code}: -${val.toLocaleString()}đ`);
                } else {
                    toast.error("Mã giảm giá không hợp lệ");
                }
            } catch (err) {
                 toast.error("Lỗi khi kiểm tra mã");
            }
        }
    };

    const onSubmit = async (data: { startTime: string; pricePerHour: number; discount: number; customDurationHours: number; customDurationMinutes: number; customTableFee: number }) => {
        setIsLoading(true);
        try {
            const newDate = new Date(data.startTime);
            const totalDuration = (Number(data.customDurationHours) || 0) * 60 + (Number(data.customDurationMinutes) || 0);

            await onSave({
                date: newDate,
                pricePerHour: Number(data.pricePerHour),
                discount: Number(data.discount),
                customDuration: totalDuration > 0 ? totalDuration : null,
                customTableFee: Number(data.customTableFee) || null,
                customItemsTotal: currentOrder.customItemsTotal ?? null
            });
            
            onOpenChange(false);
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    const productTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalTableFee = Number(watchTableFee) || 0;
    const finalDiscount = Number(watchDiscount) || 0;
    const grandTotal = Math.max(0, finalTableFee + productTotal - finalDiscount);

    // Calculate Display Duration
    const manualDuration = (Number(watchHours) || 0) * 60 + (Number(watchMinutes) || 0);
    let displayDuration = manualDuration;
    if (manualDuration === 0 && watchStartTime) {
        const start = new Date(watchStartTime);
        const now = new Date(); // Ideally this would be passed in or just use current time for preview
        const diffMs = now.getTime() - start.getTime();
        displayDuration = Math.max(0, Math.floor(diffMs / 60000));
    }

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}p`;
    };

    return (
        <ResponsiveModal 
            open={open} 
            onOpenChange={onOpenChange}
            title={`Cập nhật đơn hàng - ${tableName}`}
            description="Thông tin chi tiết và cài đặt."
            className="sm:max-w-4xl"
        >
            <div className="grid md:grid-cols-2 gap-8 p-4">
                {/* Cot trai: Settings */}
                <form id="order-settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h3 className="font-semibold text-lg pb-2 text-primary border-b border-border/50">Cài đặt đơn hàng</h3>
                    
                    <div className="space-y-3">
                        {/* Start Time */}
                        <div className="grid grid-cols-3 items-center gap-2">
                            <Label htmlFor="startTime" className="text-right text-sm">Giờ vào</Label>
                            <Input id="startTime" type="datetime-local" className="col-span-2 h-9" {...register("startTime")} />
                        </div>

                        {/* Price Per Hour */}
                        <div className="grid grid-cols-3 items-center gap-2">
                             <Label htmlFor="pricePerHour" className="text-right text-sm">Giá/Giờ</Label>
                             <div className="col-span-2 relative">
                                <Input id="pricePerHour" type="number" min="0" step="1000" className="h-9 pr-8" {...register("pricePerHour", { min: 0 })} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                             </div>
                        </div>

                         {/* Coupon */}
                         <div className="grid grid-cols-3 items-center gap-2">
                             <Label htmlFor="couponCode" className="text-right text-sm">Mã giảm giá</Label>
                             <Input 
                                id="couponCode" 
                                placeholder="Nhập mã & Enter..." 
                                className="col-span-2 h-9 uppercase placeholder:normal-case"
                                onKeyDown={handleCouponEnter}
                                {...register("couponCode")}
                             />
                        </div>

                        {/* Discount */}
                        <div className="grid grid-cols-3 items-center gap-2">
                            <Label htmlFor="discount" className="text-right text-sm">Giảm giá</Label>
                            <div className="col-span-2 relative">
                                <Input id="discount" type="number" min="0" className="h-9 pr-8" {...register("discount", { min: 0 })} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                            </div>
                        </div>

                         {/* Duration (Split Inputs) */}
                        <div className="grid grid-cols-3 items-center gap-2">
                             <Label className="text-right text-sm">Giờ chơi</Label>
                             <div className="col-span-2 flex gap-2">
                                <div className="relative flex-1">
                                    <Input id="customDurationHours" type="number" min="0" className="h-9 pr-6" {...register("customDurationHours")} />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
                                </div>
                                <div className="relative flex-1">
                                    <Input id="customDurationMinutes" type="number" min="0" max="59" className="h-9 pr-6" {...register("customDurationMinutes")} />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">p</span>
                                </div>
                             </div>
                        </div>

                        {/* Table Fee (Custom) */}
                        <div className="grid grid-cols-3 items-center gap-2">
                            <Label htmlFor="customTableFee" className="text-right text-sm">Tiền bàn</Label>
                            <div className="col-span-2 relative">
                                <Input id="customTableFee" type="number" min="0" className="h-9 pr-8" {...register("customTableFee")} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Cot phai: Details - Receipt Style */}
                <div className="space-y-4 border-l pl-8 flex flex-col h-full bg-slate-50/50 py-0 rounded-r-lg">
                    <h3 className="font-semibold text-lg pb-2 text-primary border-b border-border/50">Chi tiết thanh toán</h3>
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                         {/* Invoice Info */}
                         <div className="flex justify-between text-sm font-medium mb-2 font-mono border-b border-dashed border-gray-300 pb-2">
                            <span>Bàn: {tableName}</span>
                            <span>
                                {watchStartTime ? new Date(watchStartTime).toLocaleString('en-GB', { 
                                    day: '2-digit', month: '2-digit', year: 'numeric', 
                                    hour: '2-digit', minute: '2-digit', hour12: false 
                                }).replace(',', '') : ''}
                            </span>
                         </div>

                         {/* Receipt Header */}
                         <div className="flex justify-between text-xs uppercase border-b border-dashed border-gray-300 pb-2 mb-2 font-medium">
                            <span>Dịch vụ</span>
                            <span>Thành tiền</span>
                         </div>

                        {/* Receipt Body */}
                        <div className="flex-1 overflow-y-auto space-y-3 text-sm">
                            {/* Table Fee */}
                            <div className="flex justify-between items-start">
                                <span className="font-medium">
                                    Tiền bàn <span className="text-muted-foreground font-normal">({formatDuration(displayDuration)})</span>
                                </span>
                                <span className="font-medium">{finalTableFee.toLocaleString()}đ</span>
                            </div>

                            {/* Items */}
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start group">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name} <span className="text-muted-foreground font-normal">x{item.quantity}</span></span>
                                    </div>
                                    <span className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</span>
                                </div>
                            ))}
                            
                            {items.length === 0 && finalTableFee === 0 && (
                                <p className="text-xs text-center italic text-muted-foreground py-4">Chưa có thông tin thanh toán</p>
                            )}
                        </div>

                        {/* Receipt Footer */}
                        <div className="pt-2 border-t border-dashed border-gray-300 mt-2 space-y-2">
                             {finalDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Giảm giá</span>
                                    <span>-{finalDiscount.toLocaleString()}đ</span>
                                </div>
                             )}
                             
                             <div className="flex justify-between items-center text-lg font-bold">
                                <span className="uppercase">Tổng cộng</span>
                                <span className="text-primary">{grandTotal.toLocaleString()}đ</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-4 border-t bg-muted/10">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Hủy</Button>
                <Button type="submit" form="order-settings-form" disabled={isLoading} className="min-w-[120px]">
                    {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
            </div>
        </ResponsiveModal>
    );
}
