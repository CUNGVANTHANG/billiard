import { useState, useEffect } from "react";
import { Plus, Minus, PlayCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cartStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { PaymentDialog } from "./PaymentDialog";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function Cart({ onCheckoutSuccess }: { onCheckoutSuccess?: () => void }) {
  const { items, removeFromCart, updateQuantity, total, isTableOccupied, startSession, activeTableId } = useCartStore();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Fetch table and order info
  const tableData = useLiveQuery(async () => {
      if (!activeTableId) return null;
      const table = await db.billiardTables.get(activeTableId);
      if (!table?.currentOrderId) return { table, order: null };
      const order = await db.orders.get(table.currentOrderId);
      return { table, order };
  }, [activeTableId]);

  // Update elapsed time every minute
  useEffect(() => {
      if (!tableData?.order?.date) {
          setElapsedMinutes(0);
          return;
      }
      
      const updateElapsed = () => {
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
      await startSession();
  };

  const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}p`;
  };

  // Calculate table rental fee (rounded up to nearest hour)

  const { billingBlockDuration, enableBlockBilling } = useSettingsStore();

  // Calculate table rental fee
  const pricePerHour = tableData?.table?.pricePerHour || 0;
  let tableFee = 0;
  let timeDisplay = "";

  if (isTableOccupied) {
      if (enableBlockBilling) {
          // Block billing logic
          const blocks = Math.max(1, Math.ceil(elapsedMinutes / billingBlockDuration));
          const pricePerBlock = pricePerHour * (billingBlockDuration / 60);
          tableFee = blocks * pricePerBlock;
          timeDisplay = `${formatTime(elapsedMinutes)} (${blocks} block)`;
      } else {
          // Default hourly billing (minimum 1 hour as per previous code, or logical per hour)
          // Preserving previous behavior: Math.ceil(elapsedMinutes / 60) -> Round up to next hour
          const hoursUsed = Math.max(1, Math.ceil(elapsedMinutes / 60)); 
          tableFee = pricePerHour * hoursUsed;
          timeDisplay = `${formatTime(elapsedMinutes)} (${hoursUsed} giờ)`;
      }
  }

  const productTotal = total();
  const grandTotal = productTotal + tableFee;



  return (
    <div className="flex lg:w-[400px] w-full flex-col h-full bg-card border-l">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">
            {isTableOccupied ? "Đơn hàng" : "Đặt bàn mới"}
        </h2>
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
                    <span className="font-bold text-primary">{tableFee.toLocaleString()}đ</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {timeDisplay} × {pricePerHour.toLocaleString()}đ/giờ
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
                    <div key={item.id} className="flex gap-2 items-start group">
                         <div className="flex-1 space-y-1">
                             <p className="text-sm font-medium leading-none">{item.name}</p>
                             <p className="text-xs text-muted-foreground">{item.price.toLocaleString()}đ</p>
                         </div>
                         <div className="flex items-center gap-2">
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                    if (item.quantity > 1) updateQuantity(item.id!, item.quantity - 1);
                                    else removeFromCart(item.id!);
                                }}
                             >
                                 <Minus className="h-3 w-3" />
                             </Button>
                             <span className="w-4 text-center text-sm">{item.quantity}</span>
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                             >
                                 <Plus className="h-3 w-3" />
                             </Button>
                         </div>
                         <div className="text-sm font-bold w-16 text-right">
                             {(item.price * item.quantity).toLocaleString()}
                         </div>
                    </div>
                ))}
             </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/20 space-y-4 mt-auto">
          <div className="space-y-2">
            {isTableOccupied && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tiền bàn</span>
                    <span>{tableFee.toLocaleString()}đ</span>
                </div>
            )}
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiền sản phẩm</span>
                <span>{productTotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giảm giá</span>
                <span>0đ</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary">{grandTotal.toLocaleString()}đ</span>
            </div>
          </div>
          
          {isTableOccupied ? (
              <PaymentDialog total={grandTotal} onPaymentSuccess={onCheckoutSuccess} />
          ) : (
              <Button 
                  className="w-full h-12 text-lg gap-2" 
                  size="lg"
                  onClick={handleStartSession}
              >
                  <PlayCircle className="h-5 w-5" />
                  Đặt bàn
              </Button>
          )}
      </div>
    </div>
  );
}


