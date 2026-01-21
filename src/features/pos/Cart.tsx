import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Minus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cartStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { PaymentDialog } from "./PaymentDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Dexie removed
// import { db } from "@/lib/db"; // Removed
import { tableService } from "@/services/tableService";
import { orderService } from "@/services/orderService";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { OrderSettingsDialog } from "./OrderSettingsDialog";

interface PriceEditPopoverProps {
    title: string;
    baseValue: number;
    currentValue: number | null;
    onChange: (val: number | null) => void;
    children: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
}

function PriceEditPopover({ title, baseValue, currentValue, onChange, children, side="top" }: PriceEditPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" side={side}>
                <div className="space-y-3">
                    <h4 className="font-medium leading-none">{title}</h4>
                    
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Giá gốc:</span>
                        <span className="font-medium">{baseValue.toLocaleString()}đ</span>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs font-medium">Chiết khấu (%)</span>
                        <div className="grid grid-cols-5 gap-1">
                            {[0, 5, 10, 15, 20, 25, 30, 50, 100].map((percent) => {
                                const effectivePrice = currentValue ?? baseValue;
                                const currentDiscount = baseValue - effectivePrice;
                                const currentPercent = baseValue > 0 ? Math.round((currentDiscount / baseValue) * 100) : 0;
                                const isActive = (currentValue === null && percent === 0) || (currentValue !== null && currentPercent === percent);
                                
                                return (
                                    <Button
                                        key={percent}
                                        variant={isActive ? "default" : "outline"}
                                        size="sm"
                                        className={`h-6 text-[10px] px-0 ${isActive ? 'bg-black hover:bg-black text-white' : ''}`}
                                        onClick={() => {
                                            if (percent === 0) onChange(null);
                                            else {
                                                const discountAmount = Math.ceil((baseValue * percent) / 100);
                                                onChange(baseValue - discountAmount);
                                            }
                                        }}
                                    >
                                        {percent}%
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium">Chiết khấu (VND)</span>
                        <div className="relative">
                            <Input 
                                type="number" 
                                placeholder="0"
                                value={currentValue !== null ? (baseValue - currentValue) : ''}
                                onChange={(e) => {
                                   const val = Number(e.target.value);
                                   onChange(baseValue - val);
                                }}
                                className="h-8 pr-8"
                                min={0}
                            />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium">Giá sau giảm</span>
                        <div className="relative">
                            <Input 
                                type="number" 
                                placeholder={baseValue.toLocaleString()} 
                                value={currentValue !== null ? currentValue : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    onChange(val === '' ? null : Number(val));
                                }}
                                className="pr-8 h-8 font-bold"
                                min={0}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                        </div>
                    </div>
                    
                    {currentValue !== null && (
                        <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground hover:text-destructive" onClick={() => onChange(null)}>
                            Xóa tùy chỉnh (Về giá gốc)
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function Cart({ onCheckoutSuccess }: { onCheckoutSuccess?: () => void }) {
  const { 
      items, removeFromCart, updateQuantity, updateItemPrice, total, isTableOccupied, startSession, 
      activeTableId, clearCart, resetTable, 
      discount, setDiscount,
      customTableFee, setCustomTableFee,
      customItemsTotal, setCustomItemsTotal,
      customDuration, setCustomDuration
  } = useCartStore();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);

  // Fetch table and order info
  const { data: tableData } = useQuery({
      queryKey: ['cartData', activeTableId],
      queryFn: async () => {
          if (!activeTableId) return null;
          try {
              const table = await tableService.getById(activeTableId);
              if (!table?.currentOrderId) return { table, order: null };
              const order = await orderService.getById(table.currentOrderId);
              return { table, order };
          } catch (e) {
              return null;
          }
      },
      enabled: !!activeTableId,
      refetchInterval: 5000
  });

  const handleUpdateOrderSettings = async (data: { 
      date: Date; 
      pricePerHour: number; 
      discount: number; 
      customDuration: number | null;
      customTableFee: number | null;
  }) => {
      if (!tableData?.order?.id) return;
      
      // Update the Order in DB
      try {
          // Construct update object based on what changed. 
          // Since data has all fields, we update relevant ones.
          await orderService.update(tableData.order.id, {
              date: data.date,
              pricePerHour: data.pricePerHour,
              discount: data.discount,
              customDuration: data.customDuration ?? undefined, 
              customTableFee: data.customTableFee ?? undefined,
          });

          // Sync with Store State to reflect changes immediately in UI
          setDiscount(data.discount);
          setCustomDuration(data.customDuration);
          setCustomTableFee(data.customTableFee);

          // Force recalculation of elapsed time immediately for UI
          if (data.date) {
               const now = new Date();
               const diffMs = now.getTime() - data.date.getTime();
               setElapsedMinutes(Math.floor(diffMs / 60000));
          }

          setIsTableSettingsOpen(false);
          toast.success("Cập nhật đơn hàng thành công");
      } catch (error) {
          toast.error("Lỗi khi cập nhật đơn hàng");
      }
  };

  // Update elapsed time every minute
  useEffect(() => {
      // Helper function to seed coupons if needed (Manual trigger preferred now)
      // const seedCoupons = async () => { ... } // Removed auto-seeding

      if (!tableData?.order?.date) {
          setElapsedMinutes(0);
          return;
      }
      
      const updateElapsed = () => {
          // Handle string date from JSON/Supabase 
          const start = new Date(tableData.order!.date);
          const now = new Date();
          const diffMs = now.getTime() - start.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          setElapsedMinutes(diffMins);
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 60000);
      return () => clearInterval(interval);
  }, [tableData?.order?.date]);

  const handleStartSession = async () => {
      try {
          await startSession();
          toast.success("Đã bắt đầu phiên bàn mới");
      } catch (error) {
          toast.error("Không thể bắt đầu phiên, vui lòng thử lại");
      }
  };

  const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}p`;
  };

  // Calculate table rental fee (rounded up to nearest hour)

  const { billingBlockDuration, enableBlockBilling, gracePeriod } = useSettingsStore();

  // Calculate table rental fee
  // Prefer order-specific price, fallback to table price
  const pricePerHour = tableData?.order?.pricePerHour ?? tableData?.table?.pricePerHour ?? 0;
  let tableFee = 0;
  let timeDisplay = "";

  // Determine effective play time
  // If customDuration is set (manual override), use it. Otherwise use calculated elapsedMinutes.
  const displayMinutes = customDuration !== null ? customDuration : elapsedMinutes;
  
  // Calculate base/auto fee
  let calculatedFee = 0;
  let autoTimeDisplay = "";

  if (isTableOccupied) {
      if (displayMinutes < gracePeriod) {
          calculatedFee = 0;
          autoTimeDisplay = `${formatTime(displayMinutes)} (Khởi động)`;
      } else if (enableBlockBilling) {
           const blocks = Math.max(1, Math.ceil(displayMinutes / billingBlockDuration));
           const pricePerBlock = pricePerHour * (billingBlockDuration / 60);
           calculatedFee = Math.ceil((blocks * pricePerBlock) / 1000) * 1000;
           autoTimeDisplay = `${formatTime(displayMinutes)}`;
      } else {
           calculatedFee = Math.round(pricePerHour * (displayMinutes / 60));
           autoTimeDisplay = `${formatTime(displayMinutes)}`;
      }
      
      if (customTableFee !== null) {
          tableFee = customTableFee;
          const isDiscount = customTableFee < calculatedFee;
          timeDisplay = `${formatTime(displayMinutes)} (${isDiscount ? 'Chiết khấu' : 'Tùy chỉnh'})`;
      } else {
          tableFee = calculatedFee;
          timeDisplay = autoTimeDisplay;
      }
  }

  // Calculate raw product subtotal (before discount)
  const calculatedProductSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const productSubtotal = customItemsTotal !== null ? customItemsTotal : calculatedProductSubtotal;
  
  // Calculate final totals
  // total() in store uses customItemsTotal if set, and subtracts discount
  const productFinal = total(); 
  const grandTotal = productFinal + tableFee;



  return (
    <div className="flex lg:w-[400px] w-full flex-col h-full bg-card border-l">
      <div className="p-4 border-b flex items-center gap-2 lg:justify-between">
        <h2 className="font-semibold text-lg">
            {isTableOccupied ? "Đơn hàng" : "Đặt bàn mới"}
        </h2>
        {/* {activeTableId && (
            <Button variant="ghost" size="icon" onClick={() => setIsTableSettingsOpen(true)} title="Cài đặt bàn">
                <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
        )} */}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto p-4">
        {/* Table rental info when occupied */}
        {isTableOccupied && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Tiền bàn</span>
                    </div>
                    <span className="font-bold text-primary">
                        <PriceEditPopover 
                            title="Chỉnh sửa tiền bàn" 
                            baseValue={calculatedFee} 
                            currentValue={customTableFee} 
                            onChange={setCustomTableFee}
                            side="bottom"
                        >
                            <Button variant="ghost" className="h-auto p-0 text-base font-bold text-primary hover:bg-transparent hover:text-primary hover:underline decoration-dashed underline-offset-4">
                                {tableFee.toLocaleString()}đ
                            </Button>
                        </PriceEditPopover>
                    </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1 items-baseline">
                    <span>{timeDisplay} ×</span>
                    {customTableFee !== null && calculatedFee > 0 && Math.round(pricePerHour * (customTableFee / calculatedFee)) !== pricePerHour ? (
                        <>
                            <span className="line-through decoration-auto text-[10px]">{pricePerHour.toLocaleString()}đ/giờ</span>
                            <span className="text-red-500 font-medium">
                                {Math.round(pricePerHour * (customTableFee / calculatedFee)).toLocaleString()}đ/giờ
                            </span>
                        </>
                    ) : (
                        <span>{pricePerHour.toLocaleString()}đ/giờ</span>
                    )}
                </div>
            </div>
        )}
        
        {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <p>Giỏ hàng trống</p>
                <p className="text-sm">{isTableOccupied ? "Có thể thêm đồ ăn/thức uống" : "Chọn sản phẩm trước khi đặt bàn (tùy chọn)"}</p>
            </div>
        ) : (
             <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-start group py-2 border-b last:border-0 border-dashed">
                         {/* Row 1: Name, Qty, Total */}
                         <div className="col-span-4">
                             <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                         </div>
                         <div className="col-span-4 flex items-center justify-center gap-1">
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full" 
                                onClick={() => {
                                    if (item.quantity > 1) updateQuantity(item.id!, item.quantity - 1);
                                    else removeFromCart(item.id!);
                                }}
                             >
                                 <Minus className="h-3 w-3" />
                             </Button>
                             <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full"
                                onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                             >
                                 <Plus className="h-3 w-3" />
                             </Button>
                         </div>
                         <div className="col-span-4 text-right">
                              <PriceEditPopover
                                title="Chỉnh sửa giá"
                                    baseValue={(item.originalPrice ? Number(item.originalPrice) : item.price) * item.quantity}
                                    currentValue={ (item.originalPrice && item.price !== Number(item.originalPrice)) ? item.price * item.quantity : null }
                                    onChange={(val) => {
                                         if (!item.id) return;
                                         if (val !== null) updateItemPrice(item.id, val / item.quantity);
                                         else if (item.originalPrice) updateItemPrice(item.id, Number(item.originalPrice));
                                    }}
                                side="left"
                            >
                               <Button variant="ghost" className="h-auto p-0 font-bold hover:bg-transparent hover:underline decoration-dashed underline-offset-4 flex flex-col items-end ml-auto">
                                  <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                               </Button>
                            </PriceEditPopover>
                         </div>

                         {/* Row 2: Unit Price, Spacer, Trash */}
                         <div className="col-span-4 -mt-1">
                             <div className="text-xs text-muted-foreground flex flex-wrap gap-1 items-baseline">
                                 {item.originalPrice && item.price !== item.originalPrice && (
                                      <span className="line-through decoration-auto text-[10px]">{item.originalPrice.toLocaleString()}đ</span>
                                 )}
                                 <span className={item.originalPrice && item.price !== item.originalPrice ? "text-red-500 font-medium" : ""}>
                                     {item.price.toLocaleString()}đ
                                 </span>
                             </div>
                         </div>
                         <div className="col-span-4"></div>
                         <div className="col-span-4 text-right flex justify-end">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id!)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                         </div>
                    </div>
                ))}
             </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/20 space-y-4 mt-auto">
          <div className="space-y-2">
            {isTableOccupied && (
                <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <span>Tiền bàn</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-1 hover:bg-muted font-normal text-xs text-muted-foreground">
                                    ({formatTime(displayMinutes)}) {customDuration !== null && '*'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" side="top">
                                <div className="space-y-3">
                                    <h4 className="font-medium leading-none">Chỉnh sửa thời gian</h4>
                                    <p className="text-xs text-muted-foreground">Nhập thời gian chơi thủ công.</p>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className="space-y-1 flex-1">
                                            <span className="text-xs">Giờ</span>
                                            <Input 
                                                type="number" 
                                                min={0}
                                                value={customDuration !== null ? Math.floor(customDuration / 60) : Math.floor(displayMinutes / 60)}
                                                onChange={(e) => {
                                                    const newH = Number(e.target.value);
                                                    const currentM = customDuration !== null ? customDuration % 60 : displayMinutes % 60;
                                                    setCustomDuration(newH * 60 + currentM);
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <span className="text-xs">Phút</span>
                                            <Input 
                                                type="number" 
                                                min={0}
                                                max={59}
                                                value={customDuration !== null ? customDuration % 60 : displayMinutes % 60}
                                                onChange={(e) => {
                                                    const newM = Number(e.target.value);
                                                    const currentH = customDuration !== null ? Math.floor(customDuration / 60) : Math.floor(displayMinutes / 60);
                                                    setCustomDuration(currentH * 60 + newM);
                                                }}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>

                                    {customDuration !== null && (
                                        <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setCustomDuration(null)}>
                                            Dùng thời gian thực
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <PriceEditPopover 
                        title="Chỉnh sửa tiền bàn" 
                        baseValue={calculatedFee} 
                        currentValue={customTableFee} 
                        onChange={setCustomTableFee}
                        side="top"
                    >
                        <Button variant="ghost" size="sm" className="h-6 px-2 -mr-2 hover:bg-muted font-medium">
                            {tableFee.toLocaleString()}đ {customTableFee !== null && '*'}
                        </Button>
                    </PriceEditPopover>
                </div>
            )}
            <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Tiền sản phẩm</span>
                <span className="font-medium">{productSubtotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Giảm giá</span>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 -mr-2 hover:bg-muted text-green-500 font-medium">
                            {discount > 0 ? `-${discount.toLocaleString()}đ` : '0đ'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" side="top">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Giảm giá</h4>
                            <p className="text-xs text-muted-foreground">Nhập số tiền giảm giá direct.</p>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    step={1000}
                                    placeholder="0" 
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="pr-8"
                                    min={0}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">đ</span>
                            </div>
                            
                            <div className="pt-2 border-t mt-2">
                                <p className="text-xs text-muted-foreground mb-2">Hoặc nhập mã giảm giá:</p>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Mã CODE..." 
                                        className="h-8 text-xs uppercase"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const code = e.currentTarget.value.toUpperCase();
                                                try {
                                                    const { data: coupon, error } = await supabase
                                                        .from('coupons')
                                                        .select('*')
                                                        .eq('code', code)
                                                        .single();

                                                    if (coupon && coupon.is_active) { // Check field name mapping (snake_case)
                                                        // Assuming coupon schema: type, value, is_active
                                                        let val = 0;
                                                        if (coupon.type === 'percent') {
                                                            const subtotal = customItemsTotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
                                                            val = (subtotal * coupon.value) / 100;
                                                        } else {
                                                            val = coupon.value;
                                                        }
                                                        setDiscount(val);
                                                        toast.success(`Đã áp dụng mã ${code}: -${val.toLocaleString()}đ`);
                                                    } else {
                                                        toast.error("Mã giảm giá không hợp lệ");
                                                    }
                                                } catch (err) {
                                                     toast.error("Lỗi kiểm tra mã giảm giá");
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
                <span className="uppercase">Tổng cộng</span>
                <span className="text-primary">{grandTotal.toLocaleString()}đ</span>
            </div>
          </div>
          
          {isTableOccupied ? (
              <div className="flex gap-2">
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1 h-12 text-lg gap-2" size="lg">
                              Hủy
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận hủy thanh toán</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Bạn có chắc muốn hủy đơn hàng này? Toàn bộ sản phẩm trong giỏ hàng sẽ bị xóa và bàn sẽ được trả lại trạng thái trống.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Quay lại</AlertDialogCancel>
                              <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={async () => {
                                      try {
                                          clearCart();
                                          await resetTable();
                                          toast.success("Đã hủy đơn hàng và trả bàn");
                                          onCheckoutSuccess?.();
                                      } catch (error) {
                                          toast.error("Có lỗi xảy ra khi hủy đơn hàng");
                                      }
                                  }}
                              >
                                  Xác nhận hủy
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                  <PaymentDialog total={grandTotal} onPaymentSuccess={onCheckoutSuccess} />
              </div>
          ) : (
              <Button 
                  className="w-full h-12 text-lg gap-2" 
                  size="lg"
                  onClick={handleStartSession}
              >
                  Đặt bàn
              </Button>
          )}
      </div>
      
      {tableData?.order && (
          <OrderSettingsDialog
              open={isTableSettingsOpen} 
              onOpenChange={setIsTableSettingsOpen} 
              currentOrder={tableData.order}
              tableName={tableData.table?.name || ""}
              items={items}
              tableFee={tableFee}
              defaultPricePerHour={pricePerHour}
              defaultDurationMinutes={elapsedMinutes}
              onSave={handleUpdateOrderSettings} 
          />
      )}
    </div>
  );
}


